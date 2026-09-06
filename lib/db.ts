import { PrismaClient } from "@prisma/client";

// Prevents creating a new PrismaClient on every hot-reload in development,
// which would otherwise exhaust the Postgres connection pool.
// See: https://www.prisma.io/docs/guides/nextjs

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
