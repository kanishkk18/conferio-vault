import { requireAdminSession } from "@/lib/auth-utils";
import { AdminSidebar } from "@/components/admin-sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession();

  return (
    <div className="min-h-screen flex">
      <AdminSidebar userName={session.user.name} userEmail={session.user.email} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
