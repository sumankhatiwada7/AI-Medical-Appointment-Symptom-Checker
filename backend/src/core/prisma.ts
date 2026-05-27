import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("Missing required DATABASE_URL environment variable for PrismaClient.");
}

export const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl),
});

export async function connectPrismaWithRetry(
  attempts = 10,
  delayMs = 3000
): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await prisma.$connect();
      return;
    } catch (error) {
      lastError = error;
      console.warn(
        `Prisma connection attempt ${attempt} failed. Retrying in ${delayMs}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error(
    `Unable to connect to the database after ${attempts} attempts: ${String(lastError)}`
  );
}
