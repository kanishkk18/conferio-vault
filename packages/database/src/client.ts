import { PrismaClient } from "@prisma/client";

// Next.js hot-reloads modules in dev, which would otherwise spawn a new
// PrismaClient (and a new connection pool) on every edit. We cache the
// instance on `globalThis` so dev reloads reuse the same client.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "@prisma/client";
export default prisma;
