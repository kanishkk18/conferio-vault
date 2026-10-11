import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@securevault/database";
import { requireAuthApi } from "@/lib/auth-utils";
import { jsonError } from "@/lib/api-utils";

const bodySchema = z.object({
  publicKey: z.string().min(1),
  wrappedPrivateKey: z.string().min(1),
  privateKeyIv: z.string().min(1),
});

export async function GET() {
  const { session, error } = await requireAuthApi();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { publicKey: true, wrappedPrivateKey: true, privateKeyIv: true },
  });

  if (!user?.publicKey) {
    return NextResponse.json({ hasKeypair: false });
  }
  return NextResponse.json({ hasKeypair: true, ...user });
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireAuthApi();
  if (error) return error;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  // Only ever set once — regenerating would orphan any item already
  // shared with this user via their old public key.
  const existing = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { publicKey: true },
  });
  if (existing?.publicKey) {
    return jsonError("Keypair already exists for this account", 409);
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
  });

  return NextResponse.json({ success: true });
}
