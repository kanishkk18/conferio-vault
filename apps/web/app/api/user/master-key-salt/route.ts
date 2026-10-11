import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@securevault/database";
import { requireAuthApi } from "@/lib/auth-utils";

const bodySchema = z.object({
  masterKeySalt: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const { session, error } = await requireAuthApi();
  if (error) return error;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { masterKeySalt: parsed.data.masterKeySalt },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "master_key_salt_rotated",
    },
  });

  return NextResponse.json({ success: true });
}
