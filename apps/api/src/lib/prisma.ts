import { PrismaClient } from '@prisma/client';
import { isProd } from '../config/env';

/**
 * Single PrismaClient per process. In dev with hot-reload we cache it on
 * globalThis so watch restarts don't exhaust the connection pool.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProd ? ['warn', 'error'] : ['warn', 'error'],
  });

if (!isProd) globalForPrisma.prisma = prisma;
