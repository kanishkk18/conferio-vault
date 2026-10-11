import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { auth, type AdminSession } from "./auth";

export async function getAdminSession(): Promise<AdminSession | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session as AdminSession | null;
}

/**
 * The admin plugin's role check already runs at sign-in time (a non-admin
 * session is revoked immediately — see the `after` hook in lib/auth.ts),
 * but every server component re-checks the role here too. Defense in
 * depth: a role could change after a session was issued.
 */
export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session || session.user.role !== "admin") {
    redirect("/login");
  }
  return session;
}

/** For Route Handlers — returns a 401/403 Response instead of redirecting. */
export async function requireAdminApi(): Promise<
  { session: AdminSession; error: null } | { session: null; error: NextResponse }
> {
  const session = await getAdminSession();
  if (!session) {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.role !== "admin") {
    return { session: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session, error: null };
}
