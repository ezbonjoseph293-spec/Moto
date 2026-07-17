import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Base, unscoped Prisma Client. Not meant to be imported directly outside
 * src/lib and src/features/tenancy — see forDealership()/forPlatform() in
 * src/features/tenancy for the tenant-safe entry points.
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
