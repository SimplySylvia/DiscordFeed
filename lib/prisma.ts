import { PrismaClient } from '@prisma/client';

// Global prisma instance to prevent multiple instances in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Initialize Prisma Client with connection handling
export const prisma = globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// If in development, attach to global to prevent hot-reloading issues
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma; 