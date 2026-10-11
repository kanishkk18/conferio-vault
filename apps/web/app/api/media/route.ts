import { NextRequest, NextResponse } from "next/server";
import { Prisma, prisma } from "@securevault/database";
import { mediaListQuerySchema } from "@securevault/shared-types";
import { requireAuthApi } from "@/lib/auth-utils";
import { enforceApiRateLimit, jsonError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const rateLimited = await enforceApiRateLimit(request.headers);
  if (rateLimited) return rateLimited;

  const { session, error } = await requireAuthApi();
  if (error) return error;

  const parsedQuery = mediaListQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams)
  );
  if (!parsedQuery.success) {
    return jsonError(parsedQuery.error.issues[0]?.message ?? "Invalid query", 400);
  }
  const { fileType, year, month, search, cursor, limit } = parsedQuery.data;

  const where: Prisma.MediaItemWhereInput = {
    userId: session.user.id,
    deletedAt: null,
    ...(fileType ? { fileType } : {}),
    ...(year ? { year } : {}),
    ...(month ? { month } : {}),
    ...(search
      ? {
          OR: [
            { caption: { contains: search, mode: "insensitive" } },
            { originalName: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const items = await prisma.mediaItem.findMany({
    where,
    orderBy: [{ year: "desc" }, { month: "desc" }, { uploadedAt: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;

  return NextResponse.json({
    items: page,
    nextCursor: hasMore ? page[page.length - 1]?.id : null,
  });
}
