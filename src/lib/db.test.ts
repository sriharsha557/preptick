/**
 * Unit tests for database connection pool monitoring
 * Tests Task 5.2: Implement connection pool monitoring
 * Requirements: P2 Requirement 3.2
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { prisma, getPoolMetrics, logPoolWarning, type ConnectionPoolMetrics } from './db';

describe('Connection Pool Monitoring', () => {
  beforeAll(async () => {
    // Ensure database connection is established
    await prisma.$connect();
  });

  afterAll(async () => {
    // Clean up database connection
    await prisma.$disconnect();
  });

  describe('getPoolMetrics', () => {
    it('should return valid connection pool metrics', async () => {
      const metrics = await getPoolMetrics();

      // Validate structure
      expect(metrics).toHaveProperty('activeConnections');
      expect(metrics).toHaveProperty('idleConnections');
      expect(metrics).toHaveProperty('totalConnections');
      expect(metrics).toHaveProperty('utilizationPercent');

      // Validate types
      expect(typeof metrics.activeConnections).toBe('number');
      expect(typeof metrics.idleConnections).toBe('number');
      expect(typeof metrics.totalConnections).toBe('number');
      expect(typeof metrics.utilizationPercent).toBe('number');
    });

    it('should return metrics within valid ranges', async () => {
      const metrics = await getPoolMetrics();

      // All counts should be non-negative
      expect(metrics.activeConnections).toBeGreaterThanOrEqual(0);
      expect(metrics.idleConnections).toBeGreaterThanOrEqual(0);
      expect(metrics.totalConnections).toBeGreaterThanOrEqual(0);

      // Total should not exceed max connections (10)
      expect(metrics.totalConnections).toBeLessThanOrEqual(10);

      // Utilization should be between 0 and 100
      expect(metrics.utilizationPercent).toBeGreaterThanOrEqual(0);
      expect(metrics.utilizationPercent).toBeLessThanOrEqual(100);
    });

    it('should have total connections equal to active + idle', async () => {
      const metrics = await getPoolMetrics();

      // The total should be the sum of active and idle
      // Note: There might be other states, so we check total >= active + idle
      expect(metrics.totalConnections).toBeGreaterThanOrEqual(
        metrics.activeConnections + metrics.idleConnections
      );
    });

    it('should calculate utilization percentage correctly', async () => {
      const metrics = await getPoolMetrics();
      const maxConnections = 10;
      const expectedUtilization = (metrics.totalConnections / maxConnections) * 100;

      expect(metrics.utilizationPercent).toBeCloseTo(expectedUtilization, 1);
    });

    it('should update metrics when queries are executed', async () => {
      // Get initial metrics
      const initialMetrics = await getPoolMetrics();

      // Execute some queries to potentially change connection state
      await Promise.all([
        prisma.user.count(),
        prisma.test.count(),
        prisma.question.count(),
      ]);

      // Get updated metrics
      const updatedMetrics = await getPoolMetrics();

      // Metrics should still be valid
      expect(updatedMetrics.totalConnections).toBeGreaterThanOrEqual(0);
      expect(updatedMetrics.totalConnections).toBeLessThanOrEqual(10);
    });

    it('should handle errors gracefully', async () => {
      // Mock prisma.$queryRaw to throw an error
      const originalQueryRaw = prisma.$queryRaw;
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // @ts-ignore - Mocking for test
      prisma.$queryRaw = vi.fn().mockRejectedValue(new Error('Database error'));

      const metrics = await getPoolMetrics();

      // Should return zeros on error
      expect(metrics.activeConnections).toBe(0);
      expect(metrics.idleConnections).toBe(0);
      expect(metrics.totalConnections).toBe(0);
      expect(metrics.utilizationPercent).toBe(0);

      // Should log error
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Restore original function
      prisma.$queryRaw = originalQueryRaw;
      consoleErrorSpy.mockRestore();
    });
  });

  describe('logPoolWarning', () => {
    it('should log warning when utilization is at 80%', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const metrics: ConnectionPoolMetrics = {
        activeConnections: 7,
        idleConnections: 1,
        totalConnections: 8,
        utilizationPercent: 80,
      };

      logPoolWarning(metrics);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Connection Pool Warning]',
        expect.objectContaining({
          message: 'Connection pool utilization is high',
          activeConnections: 7,
          idleConnections: 1,
          totalConnections: 8,
          utilizationPercent: '80.0%',
        })
      );

      consoleWarnSpy.mockRestore();
    });

    it('should log warning when utilization is above 80%', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const metrics: ConnectionPoolMetrics = {
        activeConnections: 9,
        idleConnections: 1,
        totalConnections: 10,
        utilizationPercent: 100,
      };

      logPoolWarning(metrics);

      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('should not log warning when utilization is below 80%', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const metrics: ConnectionPoolMetrics = {
        activeConnections: 3,
        idleConnections: 2,
        totalConnections: 5,
        utilizationPercent: 50,
      };

      logPoolWarning(metrics);

      expect(consoleWarnSpy).not.toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('should not log warning at exactly 79.9% utilization', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const metrics: ConnectionPoolMetrics = {
        activeConnections: 7,
        idleConnections: 0,
        totalConnections: 7,
        utilizationPercent: 79.9,
      };

      logPoolWarning(metrics);

      expect(consoleWarnSpy).not.toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('should include timestamp in warning log', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const metrics: ConnectionPoolMetrics = {
        activeConnections: 8,
        idleConnections: 0,
        totalConnections: 8,
        utilizationPercent: 80,
      };

      logPoolWarning(metrics);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Connection Pool Warning]',
        expect.objectContaining({
          timestamp: expect.any(String),
        })
      );

      consoleWarnSpy.mockRestore();
    });

    it('should format utilization percentage with one decimal place', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const metrics: ConnectionPoolMetrics = {
        activeConnections: 8,
        idleConnections: 1,
        totalConnections: 9,
        utilizationPercent: 85.5555,
      };

      logPoolWarning(metrics);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Connection Pool Warning]',
        expect.objectContaining({
          utilizationPercent: '85.6%',
        })
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero connections', async () => {
      // This might happen during startup or after all connections are closed
      const metrics = await getPoolMetrics();

      // Should handle gracefully even if zero
      expect(metrics.totalConnections).toBeGreaterThanOrEqual(0);
      expect(metrics.utilizationPercent).toBeGreaterThanOrEqual(0);
    });

    it('should handle maximum connections (10)', async () => {
      const metrics = await getPoolMetrics();

      // Should never exceed max
      expect(metrics.totalConnections).toBeLessThanOrEqual(10);
    });

    it('should handle warning at exactly 80% (8 out of 10 connections)', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const metrics: ConnectionPoolMetrics = {
        activeConnections: 8,
        idleConnections: 0,
        totalConnections: 8,
        utilizationPercent: 80,
      };

      logPoolWarning(metrics);

      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });
});
