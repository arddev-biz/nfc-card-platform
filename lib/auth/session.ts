import "server-only";
import { randomBytes, createHash } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import type { User } from "@prisma/client";

const SESSION_COOKIE_NAME = "session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Creates a new session for the given user and sets the session cookie
 * on the current response. Only the SHA-256 hash of the token is
 * persisted — the raw token exists only in the browser's httpOnly cookie.
 */
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.session.create({
    data: { tokenHash, userId, expiresAt },
  });

  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/**
 * Deletes the current session (if any) from the database and clears the
 * cookie. Safe to call even if there is no active session.
 */
export async function destroySession(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } }).catch(() => {
      // Non-fatal: the cookie is cleared regardless below.
    });
  }

  cookies().delete(SESSION_COOKIE_NAME);
}

/**
 * Reads the session cookie (if present), validates it against the
 * database, and returns the associated user — or null if there is no
 * cookie, no matching session, or the session has expired. Expired
 * sessions are opportunistically deleted.
 *
 * This performs a real database lookup on every call, which is the
 * authoritative, server-side source of truth for authentication state —
 * as opposed to trusting the mere presence of a cookie.
 */
export async function getSessionUser(): Promise<User | null> {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return session.user;
}

/**
 * For use in Server Components (layouts/pages) that must be protected.
 * Redirects to /admin/login if there is no valid SUPER_ADMIN session.
 * This is the authoritative, server-side enforcement point for
 * protected admin pages — independent of middleware.
 */
export async function requireAdminSession(): Promise<User> {
  const user = await getSessionUser();

  if (!user || user.role !== "SUPER_ADMIN") {
    redirect("/admin/login");
  }

  return user;
}

/**
 * For use at the top of every /api/admin/* route handler. Returns the
 * authenticated SUPER_ADMIN user, or null if the request is
 * unauthenticated/unauthorized — callers must respond with 401
 * themselves. This re-validates against the database independently of
 * middleware and independently of any page-level check, so a route
 * called directly (e.g. via curl) is still protected.
 */
export async function getAdminApiUser(): Promise<User | null> {
  const user = await getSessionUser();
  if (!user || user.role !== "SUPER_ADMIN") return null;
  return user;
}
