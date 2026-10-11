import Link from "next/link";
import { prisma } from "@securevault/database";
import { requireAdminSession } from "@/lib/auth-utils";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdminSession();
  const { q } = await searchParams;

  const users = (await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      banned: true,
      lastLoginAt: true,
      loginCount: true,
      createdAt: true,
    },
  })) as Array<{
    id: string;
    name: string | null;
    email: string;
    role: string;
    banned: boolean;
    lastLoginAt: Date | null;
    loginCount: number;
    createdAt: Date;
  }>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Users</h1>
        <form className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by name or email…"
            className="rounded-lg bg-surface border border-border px-3 py-2 text-sm outline-none focus:border-accent w-64"
          />
          <button className="px-4 py-2 rounded-lg border border-border hover:bg-surface-hover text-sm">
            Search
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-hover text-muted text-xs">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">Name</th>
              <th className="text-left px-4 py-2.5 font-medium">Email</th>
              <th className="text-left px-4 py-2.5 font-medium">Role</th>
              <th className="text-left px-4 py-2.5 font-medium">Last login</th>
              <th className="text-left px-4 py-2.5 font-medium">Logins</th>
              <th className="text-left px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border hover:bg-surface-hover">
                <td className="px-4 py-2.5">
                  <Link href={`/users/${u.id}`} className="hover:text-accent">
                    {u.name || "—"}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-muted">{u.email}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      u.role === "admin" ? "bg-accent/15 text-accent" : "bg-surface-hover text-muted"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-muted">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "Never"}
                </td>
                <td className="px-4 py-2.5 text-muted">{u.loginCount}</td>
                <td className="px-4 py-2.5">
                  {u.banned ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-danger/15 text-danger">
                      Banned
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-success/15 text-success">
                      Active
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="text-center py-10 text-muted text-sm">No users found.</div>
        )}
      </div>
    </div>
  );
}
