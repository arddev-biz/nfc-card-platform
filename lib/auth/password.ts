import bcrypt from "bcryptjs";

// Cost factor 12: a reasonable balance of security vs. login latency in 2026.
// Can be raised later without invalidating existing hashes (bcrypt encodes
// the cost factor used into the hash string itself).
const SALT_ROUNDS = 12;

export async function hashPassword(plainTextPassword: string): Promise<string> {
  return bcrypt.hash(plainTextPassword, SALT_ROUNDS);
}

export async function verifyPassword(
  plainTextPassword: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(plainTextPassword, passwordHash);
}

// A syntactically valid (but not a real credential) bcrypt hash used to
// perform a "dummy" comparison when no user is found for a given email.
// This keeps login response timing roughly consistent whether or not the
// email exists, reducing the ability to enumerate valid admin emails via
// timing analysis.
export const DUMMY_PASSWORD_HASH =
  "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

