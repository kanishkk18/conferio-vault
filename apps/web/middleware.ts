// import { NextRequest, NextResponse } from "next/server";
// import { getSessionCookie } from "better-auth/cookies";

// const PROTECTED_PREFIXES = ["/vault", "/shared", "/settings"];
// const AUTH_PAGES = ["/login", "/register"];

// export function middleware(request: NextRequest) {
//   // IMPORTANT: this only checks whether a session cookie exists — it does
//   // NOT validate the session against the database (that would mean a DB
//   // round-trip on every request, including static assets). Treat this as a
//   // UX-only redirect. The actual authorization decision is re-checked with
//   // a real database-backed session lookup in every Server Component and
//   // Route Handler via requireAuth()/requireAuthApi() in lib/auth-utils.ts —
//   // never trust this middleware alone for access control.
//   const sessionCookie = getSessionCookie(request);
//   const { pathname } = request.nextUrl;

//   const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
//   const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

//   if (isProtected && !sessionCookie) {
//     const loginUrl = new URL("/login", request.url);
//     loginUrl.searchParams.set("redirect", pathname);
//     return NextResponse.redirect(loginUrl);
//   }

//   if (isAuthPage && sessionCookie) {
//     return NextResponse.redirect(new URL("/vault/passwords", request.url));
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/vault/:path*", "/shared/:path*", "/settings/:path*", "/login", "/register"],
// };

// apps/web/middleware.ts

import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PROTECTED_PREFIXES = ["/vault", "/shared", "/settings"];
const AUTH_PAGES = ["/login", "/register"];

export function middleware(request: NextRequest) {
  // Try the standard getter first
  let sessionCookie = getSessionCookie(request);
  
  // If not found, try the exact cookie name with prefix
  if (!sessionCookie) {
    sessionCookie = request.cookies.get("securevault.session_token")?.value ?? null;
  }
  
  // Also try without prefix (in case nextCookies uses different naming)
  if (!sessionCookie) {
    sessionCookie = request.cookies.get("session_token")?.value ?? null;
  }
  
  // Debug: log all cookies to see what's actually there
  const allCookies = request.cookies.getAll();
  console.log("=== MIDDLEWARE DEBUG ===");
  console.log("Path:", request.nextUrl.pathname);
  console.log("All cookies:", allCookies.map(c => c.name));
  console.log("Session cookie found:", !!sessionCookie);
  console.log("========================");

  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  if (isProtected && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && sessionCookie) {
    return NextResponse.redirect(new URL("/vault/passwords", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/vault/:path*", "/shared/:path*", "/settings/:path*", "/login", "/register"],
};

// import { NextRequest, NextResponse } from "next/server";
// import { getSessionCookie } from "better-auth/cookies";

// const PROTECTED_PREFIXES = ["/vault", "/shared", "/settings"];
// const AUTH_PAGES = ["/login", "/register"];

// export function middleware(request: NextRequest) {
//   // IMPORTANT: this only checks whether a session cookie exists — it does
//   // NOT validate the session against the database (that would mean a DB
//   // round-trip on every request, including static assets). Treat this as a
//   // UX-only redirect. The actual authorization decision is re-checked with
//   // a real database-backed session lookup in every Server Component and
//   // Route Handler via requireAuth()/requireAuthApi() in lib/auth-utils.ts —
//   // never trust this middleware alone for access control.
//   const sessionCookie = getSessionCookie(request, { cookiePrefix: "securevault" });
//   const { pathname } = request.nextUrl;

//   const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
//   const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

//   if (isProtected && !sessionCookie) {
//     const loginUrl = new URL("/login", request.url);
//     loginUrl.searchParams.set("redirect", pathname);
//     return NextResponse.redirect(loginUrl);
//   }

//   if (isAuthPage && sessionCookie) {
//     return NextResponse.redirect(new URL("/vault/passwords", request.url));
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/vault/:path*", "/shared/:path*", "/settings/:path*", "/login", "/register"],
// };