import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
  keepAliveInterval: ReturnType<typeof setInterval> | undefined;
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Keep-alive ping every 4 minutes to prevent Neon DB from auto-suspending
if (!globalForPrisma.keepAliveInterval) {
  globalForPrisma.keepAliveInterval = setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      console.error('[DB Keep-Alive] Ping failed:', err);
    }
  }, 4 * 60 * 1000); // every 4 minutes
}

export default prisma;
