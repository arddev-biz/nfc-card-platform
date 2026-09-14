/**
 * Creates (or updates the password/role of) the single SUPER_ADMIN
 * account. There is no public registration page — this is the only way
 * to provision an admin account.
 *
 * Usage (credentials are passed inline and never written to disk):
 *
 *   ADMIN_EMAIL="you@example.com" ADMIN_PASSWORD="a-strong-password" npm run create-admin
 *
 * Safe to re-run: if the email already exists, its password and role
 * are updated rather than creating a duplicate account.
 */
import { db } from "../lib/db";
import { hashPassword } from "../lib/auth/password";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      "Missing credentials. Usage:\n" +
        '  ADMIN_EMAIL="you@example.com" ADMIN_PASSWORD="a-strong-password" npm run create-admin'
    );
    process.exitCode = 1;
    return;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    console.error("ADMIN_EMAIL is not a valid email address.");
    process.exitCode = 1;
    return;
  }

  if (password.length < 8) {
    console.error("ADMIN_PASSWORD must be at least 8 characters.");
    process.exitCode = 1;
    return;
  }

  const passwordHash = await hashPassword(password);

  const user = await db.user.upsert({
    where: { email },
    update: { passwordHash, role: "SUPER_ADMIN" },
    create: { email, passwordHash, role: "SUPER_ADMIN" },
  });

  console.log(`SUPER_ADMIN account ready: ${user.email}`);
}

main()
  .catch((error) => {
    console.error("Failed to create admin account:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
