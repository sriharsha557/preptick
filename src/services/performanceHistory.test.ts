// Performance History Service tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PerformanceHistoryService } from './performanceHistory';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
const mockPrisma = {
  test: {
    findMany: vi.fn(),
  },
  performanceReport: {
    findUnique: vi.fn(),
  },
} as unknown as PrismaClient;

describe('PerformanceHistoryService', () => {
  let historyService: PerformanceHistoryService;

  beforeEach(() => {
    historyService = new PerformanceHistoryService(mockPrisma);
    vi.clearAllMocks();
  });

  describe('getTestHistory', () => {
    it('should return tests in reverse chronological order', async () => {
      const mockTests = [
        {
          id: 'test-3',
          userId: 'user-1',
          subject: 'Mathematics',
          topics: '["topic-1", "topic-2"]',
          status: 'Submitted',
          createdAt: new Date('2024-01-03'),
          evaluations: [{ overallScore: 85 }],
        },
        {
          id: 'test-2',
          userId: 'user-1',
          subject: 'Mathematics',
          topics: '["topic-1"]',
          status: 'Submitted',
          createdAt: new Date('2024-01-02'),
          evaluations: [{ overallScore: 75 }],
        },
        {
          id: 'test-1',
          userId: 'user-1',
          subject: 'Science',
          topics: '["topic-3"]',
          status: 'Submitted',
          createdAt: new Date('2024-01-01'),
          evaluations: [{ overallScore: 90 }],
        },
      ];

      (mockPrisma.test.findMany as any).mockResolvedValue(mockTests);

      const history = await historyService.getTestHistory('user-1');

      expect(history).toHaveLength(3);
      expect(history[0].testId).toBe('test-3'); // Most recent first
      expect(history[1].testId).toBe('test-2');
      expect(history[2].testId).toBe('test-1');
    });

    it('should include all required fields', async () => {
      const mockTests = [
        {
          id: 'test-1',
          userId: 'user-1',
          subject: 'Mathematics',
          topics: '["topic-1", "topic-2"]',
          status: 'Submitted',
          createdAt: new Date('2024-01-01'),
          evaluations: [{ overallScore: 85 }],
        },
      ];

      (mockPrisma.test.findMany as any).mockResolvedValue(mockTests);

      const history = await historyService.getTestHistory('user-1');

      expect(history[0]).toEqual({
        testId: 'test-1',
        testDate: expect.any(Date),
        subject: 'Mathematics',
        topics: ['topic-1', 'topic-2'],
        overallScore: 85,
      });
    });

    it('should return empty array for user with no tests', async () => {
      (mockPrisma.test.findMany as any).mockResolvedValue([]);

      const history = await historyService.getTestHistory('user-1');

      expect(history).toEqual([]);
    });

    it('should only include submitted tests', async () => {
      const mockTests = [
        {
          id: 'test-1',
          userId: 'user-1',
          subject: 'Mathematics',
          topics: '["topic-1"]',
          status: 'Submitted',
          createdAt: new Date('2024-01-01'),
          evaluations: [{ overallScore: 85 }],
        },
      ];

      (mockPrisma.test.findMany as any).mockResolvedValue(mockTests);

      await historyService.getTestHistory('user-1');

      expect(mockPrisma.test.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          status: 'Submitted',
        },
        include: {
          evaluations: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });

  describe('getHistoricalPerformanceReport', () => {
    it('should retrieve complete historical report', async () => {
      const mockReport = {
        id: 'report-1',
        testId: 'test-1',
        userId: 'user-1',
        evaluationId: 'eval-1',
        weakTopics: JSON.stringify([
          {
            topicId: 'topic-1',
            topicName: 'Algebra',
            score: 50,
            questionsAttempted: 10,
            questionsCorrect: 5,
          },
        ]),
        improvementSuggestions: JSON.stringify([
          {
            topicId: 'topic-1',
            syllabusSection: 'Chapter 2',
            conceptsToReview: ['Concept 1'],
            retryTestOption: true,
          },
        ]),
        createdAt: new Date(),
        evaluation: {
          id: 'eval-1',
          testId: 'test-1',
          userId: 'user-1',
          overallScore: 75,
          correctCount: 15,
          totalCount: 20,
          evaluatedAt: new Date(),
          topicScores: [
            {
              topicId: 'topic-1',
              topicName: 'Algebra',
              correct: 5,
              total: 10,
              percentage: 50,
            },
          ],
        },
      };

      (mockPrisma.performanceReport.findUnique as any).mockResolvedValue(mockReport);

      const result = await historyService.getHistoricalPerformanceReport('test-1');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.reportId).toBe('report-1');
        expect(result.value.weakTopics).toHaveLength(1);
        expect(result.value.suggestions).toHaveLength(1);
        expect(result.value.evaluation.overallScore).toBe(75);
      }
    });

    it('should return error if report not found', async () => {
      (mockPrisma.performanceReport.findUnique as any).mockResolvedValue(null);

      const result = await historyService.getHistoricalPerformanceReport('nonexistent');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('NotFound');
      }
    });
  });

  describe('getPerformanceTrends', () => {
    it('should calculate performance trends over time', async () => {
      const mockTests = [
        {
          id: 'test-1',
          userId: 'user-1',
          subject: 'Mathematics',
          status: 'Submitted',
          createdAt: new Date('2024-01-01'),
          evaluations: [
            {
              overallScore: 70,
              topicScores: [
                {
                  topicId: 'topic-1',
                  topicName: 'Algebra',
                  percentage: 60,
                },
              ],
            },
          ],
        },
        {
          id: 'test-2',
          userId: 'user-1',
          subject: 'Mathematics',
          status: 'Submitted',
          createdAt: new Date('2024-01-02'),
          evaluations: [
            {
              overallScore: 80,
              topicScores: [
                {
                  topicId: 'topic-1',
                  topicName: 'Algebra',
                  percentage: 75,
                },
              ],
            },
          ],
        },
      ];

      (mockPrisma.test.findMany as any).mockResolvedValue(mockTests);

      const trends = await historyService.getPerformanceTrends('user-1', 'Mathematics');

      expect(trends.length).toBeGreaterThan(0);
      
      // Check subject trend
      const subjectTrend = trends.find(t => !t.topicId);
      expect(subjectTrend).toBeDefined();
      expect(subjectTrend?.dataPoints).toHaveLength(2);
      expect(subjectTrend?.dataPoints[0].score).toBe(70);
      expect(subjectTrend?.dataPoints[1].score).toBe(80);

      // Check topic trend
      const topicTrend = trends.find(t => t.topicId === 'topic-1');
      expect(topicTrend).toBeDefined();
      expect(topicTrend?.dataPoints).toHaveLength(2);
      expect(topicTrend?.dataPoints[0].score).toBe(60);
      expect(topicTrend?.dataPoints[1].score).toBe(75);
    });

    it('should return empty trends for subject with no tests', async () => {
      (mockPrisma.test.findMany as any).mockResolvedValue([]);

      const trends = await historyService.getPerformanceTrends('user-1', 'Mathematics');

      expect(trends).toHaveLength(1); // Only subject trend with no data points
      expect(trends[0].dataPoints).toHaveLength(0);
    });
  });

  describe('getUserSummary', () => {
    it('should calculate user summary statistics', async () => {
      const mockTests = [
        {
          id: 'test-1',
          subject: 'Mathematics',
          status: 'Submitted',
          createdAt: new Date('2024-01-01'),
          evaluations: [{ overallScore: 80 }],
        },
        {
          id: 'test-2',
          subject: 'Mathematics',
          status: 'Submitted',
          createdAt: new Date('2024-01-02'),
          evaluations: [{ overallScore: 90 }],
        },
        {
          id: 'test-3',
          subject: 'Science',
          status: 'Submitted',
          createdAt: new Date('2024-01-03'),
          evaluations: [{ overallScore: 70 }],
        },
      ];

      (mockPrisma.test.findMany as any).mockResolvedValue(mockTests);

      const summary = await historyService.getUserSummary('user-1');

      expect(summary.totalTests).toBe(3);
      expect(summary.averageScore).toBe(80); // (80 + 90 + 70) / 3
      expect(summary.testsBySubject.get('Mathematics')).toBe(2);
      expect(summary.testsBySubject.get('Science')).toBe(1);
    });

    it('should handle user with no tests', async () => {
      (mockPrisma.test.findMany as any).mockResolvedValue([]);

      const summary = await historyService.getUserSummary('user-1');

      expect(summary.totalTests).toBe(0);
      expect(summary.averageScore).toBe(0);
      expect(summary.testsBySubject.size).toBe(0);
    });
  });
});
