import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@securevault/database";
import { requireAuthApi } from "@/lib/auth-utils";
import { enforceApiRateLimit, jsonError } from "@/lib/api-utils";

const querySchema = z.object({ email: z.string().email() });

export async function GET(request: NextRequest) {
  const rateLimited = await enforceApiRateLimit(request.headers);
  if (rateLimited) return rateLimited;

  const { session, error } = await requireAuthApi();
  if (error) return error;

  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return jsonError("Invalid email", 400);

  if (parsed.data.email.toLowerCase() === session.user.email.toLowerCase()) {
    return jsonError("You can't share with yourself", 400);
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, name: true, email: true, publicKey: true },
  });

  if (!user || !user.publicKey) {
    // Same response whether the account doesn't exist or just hasn't set
    // up a vault yet — both mean "can't share with this address right now".
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found: true,
    id: user.id,
    name: user.name,
    email: user.email,
    publicKey: user.publicKey,
  });
}
