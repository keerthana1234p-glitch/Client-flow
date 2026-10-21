import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

let databaseUrl = process.env.DATABASE_URL;

// On Vercel serverless read-only environments, copy SQLite DB to /tmp so writes succeed
if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
  try {
    const tmpDbPath = path.join('/tmp', 'dev.db');
    if (!fs.existsSync(tmpDbPath)) {
      const candidates = [
        path.join(process.cwd(), 'prisma', 'dev.db'),
        path.join(process.cwd(), 'dev.db'),
        path.resolve('./prisma/dev.db'),
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          fs.copyFileSync(candidate, tmpDbPath);
          break;
        }
      }
    }
    if (fs.existsSync(tmpDbPath)) {
      databaseUrl = `file:${tmpDbPath}`;
    }
  } catch (e) {
    console.error('Failed to initialize /tmp database:', e);
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
