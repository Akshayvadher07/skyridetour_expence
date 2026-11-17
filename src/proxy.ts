// =============================================================================
// SkyRideTour — Next.js Proxy (Route Protection)
// Renamed from middleware.ts → proxy.ts per Next.js 16 convention.
// Edge-runtime: blocks unauthenticated access to all business pages
// and redirects authenticated users away from /login.
// =============================================================================

import { withAuth, NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse }                   from "next/server";

/**
 * Protected route prefixes — any path starting with these requires a valid session.
 */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/trips",
  "/customers",
  "/vehicles",
  "/drivers",
  "/expenses",
  "/payments",
  "/analytics",
  "/reports",
  "/settings",
] as const;

// ─── withAuth HOC — injects req.nextauth.token from the JWT cookie ────────────

export default withAuth(
  function proxy(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl;
    const token        = req.nextauth.token;
    const isAuthed     = !!token;

    // ── 1. Authenticated user visiting /login → send to dashboard ─────────────
    if (isAuthed && pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // ── 2. Authenticated user visiting root → send to dashboard ──────────────
    if (isAuthed && pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // ── 3. Unauthenticated user visiting a protected route → /login ───────────
    const isProtected = PROTECTED_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix)
    );

    if (!isAuthed && isProtected) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname); // restore after login
      return NextResponse.redirect(loginUrl);
    }

    // ── 4. Everything else — pass through ─────────────────────────────────────
    return NextResponse.next();
  },
  {
    callbacks: {
      /**
       * Always return true so our proxy function above handles all redirect logic.
       * (Returning false here would trigger NextAuth's own redirect before we get control.)
       */
      authorized: () => true,
    },
  }
);

/**
 * Route matcher — proxy runs ONLY on matched paths.
 * Excludes static assets, image CDN, NextAuth API, and file extensions
 * so the edge function isn't invoked on every asset request.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|api/auth|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|css|js|woff2?|ttf|otf|eot|map)).*)",
  ],
};
