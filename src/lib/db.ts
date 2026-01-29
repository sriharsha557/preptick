// Database client singleton

import { PrismaClient } from '@prisma/client';

// Create a singleton instance of PrismaClient
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Helper function to disconnect (useful for testing)
export const disconnectDb = async () => {
  await prisma.$disconnect();
};

// Helper function to connect (useful for testing)
export const connectDb = async () => {
  await prisma.$connect();
};
