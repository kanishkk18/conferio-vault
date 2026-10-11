import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@securevault/database";
import { requireAdminApi } from "@/lib/auth-utils";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(request: NextRequest) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const action = request.nextUrl.searchParams.get("action") ?? undefined;
  const userId = request.nextUrl.searchParams.get("userId") ?? undefined;

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(action ? { action: { contains: action, mode: "insensitive" } } : {}),
      ...(userId ? { userId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: { user: { select: { email: true } } },
  });

  const header = "id,action,userEmail,resource,resourceId,ipAddress,userAgent,createdAt";
  interface AuditLogRow {
    id: string;
    action: string;
    resource: string | null;
    resourceId: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
    user: { email: string } | null;
  }

  const rows = (logs as AuditLogRow[]).map((l) =>
    [
      l.id,
      l.action,
      l.user?.email ?? "",
      l.resource ?? "",
      l.resourceId ?? "",
      l.ipAddress ?? "",
      l.userAgent ?? "",
      l.createdAt.toISOString(),
    ]
      .map((v) => csvEscape(String(v)))
      .join(",")
  );
  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
