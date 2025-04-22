import { PrismaClient } from '@prisma/client';

// Declare global variable for PrismaClient to handle hot reloading in development
declare global {
  var prisma: PrismaClient | undefined;
}

// Initialize Prisma Client with connection handling
export const prisma = global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// If in development, attach to global to prevent hot-reloading issues
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;