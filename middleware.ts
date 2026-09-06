import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "session";

/**
 * Fast, edge-runtime redirect for requests to /admin/* with no session
 * cookie at all. This exists purely for a snappier UX (avoids rendering
 * a server component only to redirect) and runs before Node.js code.
 *
 * IMPORTANT — this is NOT the security boundary. The Edge runtime cannot
 * run Prisma, so this only checks that a cookie is *present*, not that
 * it corresponds to a valid, unexpired session in the database. The
 * authoritative check happens server-side, on every request, in:
 *   - app/admin/(protected)/layout.tsx via requireAdminSession()
 *   - every /api/admin/* route handler via getAdminApiUser()
 * Both independently query the database and must not be bypassed by
 * anything that happens (or fails to happen) here.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const hasSessionCookie = request.cookies.has(SESSION_COOKIE_NAME);

  if (!hasSessionCookie) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Public routes ("/", "/[businessSlug]", "/c/[cardToken]") are
  // deliberately not matched here and remain fully unauthenticated.
  matcher: ["/admin/:path*"],
};
