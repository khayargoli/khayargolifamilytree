import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

import { parseEnv } from "./env";

const globalForDb = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};

export function getPrisma(): PrismaClient {
  if (!globalForDb.prisma) {
    const pool =
      globalForDb.pool ??
      new Pool({
        connectionString: parseEnv(process.env).DATABASE_URL,
      });
    globalForDb.pool = pool;
    globalForDb.prisma = new PrismaClient({
      adapter: new PrismaPg(pool),
    });
  }

  return globalForDb.prisma;
}
