import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@securevault/database";
import { requireAuthApi } from "@/lib/auth-utils";
import { enforceApiRateLimit } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const rateLimited = await enforceApiRateLimit(request.headers);
  if (rateLimited) return rateLimited;

  const { session, error } = await requireAuthApi();
  if (error) return error;

  const groups = await prisma.mediaItem.groupBy({
    by: ["year", "month"],
    where: { userId: session.user.id, deletedAt: null },
    _count: { id: true },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  return NextResponse.json({
    groups: groups.map((g: { year: number; month: number; _count: { id: number } }) => ({
      year: g.year,
      month: g.month,
      count: g._count.id,
    })),
  });
}
