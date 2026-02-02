// Database client singleton

import { PrismaClient } from '@prisma/client';

// Create a singleton instance of PrismaClient
const globalForPrisma = global as unknown as { prisma: PrismaClient };

/**
 * Configure connection pool settings for Prisma
 * Requirements: P2 Requirement 3.6
 * - Max connections: 10
 * - Connection timeout: 5000ms
 * - Idle timeout: 30000ms (30 seconds)
 */
function getConnectionUrl(): string {
  const baseUrl = process.env.DATABASE_URL || '';
  
  // Parse the URL to add connection pool parameters
  const url = new URL(baseUrl);
  
  // Set connection pool parameters for PostgreSQL
  url.searchParams.set('connection_limit', '10');           // Max connections
  url.searchParams.set('pool_timeout', '5');                // Pool timeout in seconds (5000ms)
  url.searchParams.set('connect_timeout', '5');             // Connect timeout in seconds (5000ms)
  
  // Note: PostgreSQL idle_in_transaction_session_timeout is set at database level
  // The 30-second idle timeout should be configured in the database or via pgBouncer
  // For Prisma, we rely on the connection_limit and timeouts above
  
  return url.toString();
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Connection pool configuration for P2 improvements (Requirement 3.6)
    datasources: {
      db: {
        url: getConnectionUrl(),
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Connection pool metrics interface
 * Used for monitoring database connection health
 */
export interface ConnectionPoolMetrics {
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  utilizationPercent: number;
}

/**
 * Get current connection pool metrics
 * Queries PostgreSQL system tables to get real-time connection information
 * Requirements: P2 Requirement 3.2
 */
export async function getPoolMetrics(): Promise<ConnectionPoolMetrics> {
  try {
    // Query PostgreSQL to get connection statistics
    // This queries pg_stat_activity to count connections from this application
    const result = await prisma.$queryRaw<Array<{
      active: bigint;
      idle: bigint;
      total: bigint;
    }>>`
      SELECT 
        COUNT(*) FILTER (WHERE state = 'active') as active,
        COUNT(*) FILTER (WHERE state = 'idle') as idle,
        COUNT(*) as total
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND usename = current_user
        AND pid != pg_backend_pid()
    `;

    const stats = result[0];
    const activeConnections = Number(stats.active);
    const idleConnections = Number(stats.idle);
    const totalConnections = Number(stats.total);
    
    // Calculate utilization percentage based on max connections (10)
    const maxConnections = 10;
    const utilizationPercent = (totalConnections / maxConnections) * 100;

    return {
      activeConnections,
      idleConnections,
      totalConnections,
      utilizationPercent,
    };
  } catch (error) {
    // If we can't get metrics, return zeros and log the error
    console.error('[Connection Pool] Failed to get metrics:', error);
    return {
      activeConnections: 0,
      idleConnections: 0,
      totalConnections: 0,
      utilizationPercent: 0,
    };
  }
}

/**
 * Log connection pool warning when utilization is high
 * Requirements: P2 Requirement 3.2
 */
export function logPoolWarning(metrics: ConnectionPoolMetrics): void {
  if (metrics.utilizationPercent >= 80) {
    console.warn('[Connection Pool Warning]', {
      message: 'Connection pool utilization is high',
      activeConnections: metrics.activeConnections,
      idleConnections: metrics.idleConnections,
      totalConnections: metrics.totalConnections,
      utilizationPercent: `${metrics.utilizationPercent.toFixed(1)}%`,
      timestamp: new Date().toISOString(),
    });
  }
}

// Helper function to disconnect (useful for testing)
export const disconnectDb = async () => {
  await prisma.$disconnect();
};

// Helper function to connect (useful for testing)
export const connectDb = async () => {
  await prisma.$connect();
};
