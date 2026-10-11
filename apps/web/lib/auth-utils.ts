import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { auth, type Session } from "./auth";

/** Reads the current session. Returns null if not authenticated — never throws. */
export async function getSession(): Promise<Session | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session as Session | null;
}

/**
 * For use in Server Components / Server Actions. Redirects to /login if
 * there's no session. This is a real database-backed check (not just a
 * cookie-presence check like middleware does), so it's safe to treat its
 * result as authoritative.
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

/** Same as requireAuth, but also enforces the admin role. */
export async function requireAdmin(): Promise<Session> {
  const session = await requireAuth();
  if (session.user.role !== "admin") {
    redirect("/unauthorized");
  }
  return session;
}

/**
 * For use inside Route Handlers (app/api/**). Returns a 401/403 Response
 * directly instead of redirecting, since API routes shouldn't return HTML
 * redirects to fetch() callers.
 */
export async function requireAuthApi(): Promise<
  { session: Session; error: null } | { session: null; error: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, error: null };
}

export async function requireAdminApi(): Promise<
  { session: Session; error: null } | { session: null; error: NextResponse }
> {
  const result = await requireAuthApi();
  if (result.error) return result;
  if (result.session.user.role !== "admin") {
    return {
      session: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return result;
}
