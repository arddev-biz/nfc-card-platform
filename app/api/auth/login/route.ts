import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, DUMMY_PASSWORD_HASH } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { loginSchema } from "@/lib/auth/validation";
import { checkRateLimit, resetRateLimit } from "@/lib/auth/rateLimit";

// Prisma and bcrypt require the Node.js runtime — not the Edge runtime.
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid email and password." },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  // Rate-limit by IP + email combination so one attacker can't lock out
  // a legitimate admin by spamming their email from many IPs, while still
  // slowing down brute-force attempts against a single account.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateLimitKey = `${ip}:${email}`;
  const rateLimit = checkRateLimit(rateLimitKey);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds ?? 600) } }
    );
  }

  const user = await db.user.findUnique({ where: { email } });

  // Always run a bcrypt comparison, even when no user is found, so that
  // response timing doesn't reveal whether the email exists.
  const passwordIsValid = await verifyPassword(
    password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH
  );

  if (!user || user.role !== "SUPER_ADMIN" || !passwordIsValid) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  resetRateLimit(rateLimitKey);
  await createSession(user.id);

  // Never return the password hash or any other sensitive field.
  return NextResponse.json({ success: true });
}
