import { getDashboardStats, getSignupsLast30Days, getFileTypeDistribution } from "@/lib/stats";
import { SignupsChart, FileTypeChart } from "@/components/charts";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

export default async function DashboardPage() {
  const [stats, signups, fileTypes] = await Promise.all([
    getDashboardStats(),
    getSignupsLast30Days(),
    getFileTypeDistribution(),
  ]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total users" value={stats.totalUsers.toLocaleString()} />
        <StatCard label="Passwords stored" value={stats.totalPasswords.toLocaleString()} />
        <StatCard label="Media files" value={stats.totalMedia.toLocaleString()} />
        <StatCard label="Storage used" value={formatBytes(stats.storageBytes)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="text-sm font-medium mb-2">Signups — last 30 days</h2>
          <SignupsChart data={signups} />
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="text-sm font-medium mb-2">File types uploaded</h2>
          {fileTypes.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-sm text-muted">
              No files yet
            </div>
          ) : (
            <FileTypeChart data={fileTypes} />
          )}
        </div>
      </div>
    </div>
  );
}
