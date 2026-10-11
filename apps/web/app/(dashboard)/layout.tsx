import { requireAuth } from "@/lib/auth-utils";
import { Sidebar } from "@/components/layout/sidebar";
import { VaultGate } from "@/components/vault/vault-gate";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();

  return (
    <div className="min-h-screen flex">
      <Sidebar userName={session.user.name} userEmail={session.user.email} />
      <div className="flex-1 flex flex-col min-w-0">
        <VaultGate>{children}</VaultGate>
      </div>
    </div>
  );
}
