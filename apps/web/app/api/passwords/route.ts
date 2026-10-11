import { NextRequest, NextResponse } from "next/server";
import { Prisma, prisma } from "@securevault/database";
import { createPasswordSchema, passwordListQuerySchema } from "@securevault/shared-types";
import { requireAuthApi } from "@/lib/auth-utils";
import { enforceApiRateLimit, jsonError, logAudit, requestMeta } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const rateLimited = await enforceApiRateLimit(request.headers);
  if (rateLimited) return rateLimited;

  const { session, error } = await requireAuthApi();
  if (error) return error;

  const parsedQuery = passwordListQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams)
  );
  if (!parsedQuery.success) {
    return jsonError(parsedQuery.error.issues[0]?.message ?? "Invalid query", 400);
  }
  const { category, search, tag, sort, cursor, limit } = parsedQuery.data;

  const where: Prisma.PasswordWhereInput = {
    userId: session.user.id,
    deletedAt: null,
    ...(category ? { category } : {}),
    ...(tag ? { tags: { has: tag } } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { username: { contains: search, mode: "insensitive" } },
            { url: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.PasswordOrderByWithRelationInput[] =
    sort === "alphabetical"
      ? [{ title: "asc" }]
      : sort === "category"
        ? [{ category: "asc" }, { title: "asc" }]
        : [{ updatedAt: "desc" }];

  const items = await prisma.password.findMany({
    where,
    orderBy,
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

export async function POST(request: NextRequest) {
  const rateLimited = await enforceApiRateLimit(request.headers);
  if (rateLimited) return rateLimited;

  const { session, error } = await requireAuthApi();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = createPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }
  const data = parsed.data;

  const created = await prisma.password.create({
    data: {
      userId: session.user.id,
      title: data.title,
      username: data.username,
      url: data.url || null,
      category: data.category,
      tags: data.tags,
      icon: data.icon,
      isHidden: data.isHidden,
      encryptedData: data.encryptedData,
      iv: data.iv,
      encryptedDataKey: data.encryptedDataKey,
      keyIv: data.keyIv,
    },
  });

  const { ipAddress, userAgent } = requestMeta(request);
  await logAudit({
    userId: session.user.id,
    action: "password_create",
    resource: "password",
    resourceId: created.id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json(created, { status: 201 });
}
