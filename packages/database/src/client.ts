import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Prisma 7 requires an explicit driver adapter to connect to the database.
// This factory centralizes adapter configuration so callers never need to
// know about Prisma driver adapter details.
export function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required to create a Prisma client');
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}
