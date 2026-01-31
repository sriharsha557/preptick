// Performance History Service
// Tracks and retrieves historical test performance

import { PrismaClient } from '@prisma/client';
import {
  UserId,
  TestId,
  Subject,
  TopicId,
  TestHistoryEntry,
  PerformanceTrend,
  TrendDataPoint,
  PerformanceReport,
  Result,
  Ok,
  Err,
} from '../types';

export class PerformanceHistoryService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get test history for a user
   * Requirements: 11.1, 11.2, 11.3
   * 
   * Returns tests in reverse chronological order (most recent first)
   * Includes test date, subject, topics, and overall score
   */
  async getTestHistory(userId: UserId): Promise<TestHistoryEntry[]> {
    const tests = await this.prisma.test.findMany({
      where: {
        userId,
        status: 'Submitted', // Only include completed tests
      },
      include: {
        evaluations: true,
      },
      orderBy: {
        createdAt: 'desc', // Reverse chronological order
      },
    });

    const history: TestHistoryEntry[] = tests.map(test => {
      // Parse topics from JSON
      let topics: TopicId[] = [];
      try {
        topics = JSON.parse(test.topics);
      } catch {
        topics = [];
      }

      // Get overall score from evaluation
      const evaluation = test.evaluations[0];
      const overallScore = evaluation ? evaluation.overallScore : 0;

      return {
        testId: test.id,
        testDate: test.createdAt,
        subject: test.subject,
        topics,
        overallScore,
      };
    });

    return history;
  }

  /**
   * Get performance report for a historical test
   * Requirements: 11.4
   * 
   * Returns complete original report with all data preserved
   */
  async getHistoricalPerformanceReport(
    testId: TestId
  ): Promise<Result<PerformanceReport, { type: 'NotFound'; resource: string; id: string }>> {
    try {
      const report = await this.prisma.performanceReport.findUnique({
        where: { testId },
        include: {
          evaluation: {
            include: {
              topicScores: true,
            },
          },
        },
      });

      if (!report) {
        return Err({
          type: 'NotFound',
          resource: 'PerformanceReport',
          id: testId,
        });
      }

      // Parse JSON fields
      const weakTopics = JSON.parse(report.weakTopics);
      const suggestions = JSON.parse(report.improvementSuggestions);

      // Build topic scores
      const topicScores = report.evaluation.topicScores.map(ts => ({
        topicId: ts.topicId,
        topicName: ts.topicName,
        correct: ts.correct,
        total: ts.total,
        percentage: ts.percentage,
      }));

      const performanceReport: PerformanceReport = {
        reportId: report.id,
        testId: report.testId,
        userId: report.userId,
        evaluationId: report.evaluationId,
        evaluation: {
          evaluationId: report.evaluation.id,
          testId: report.evaluation.testId,
          userId: report.evaluation.userId,
          overallScore: report.evaluation.overallScore,
          correctCount: report.evaluation.correctCount,
          totalCount: report.evaluation.totalCount,
          topicScores,
          evaluatedAt: report.evaluation.evaluatedAt,
        },
        weakTopics,
        suggestions,
        createdAt: report.createdAt,
      };

      return Ok(performanceReport);
    } catch (error) {
      return Err({
        type: 'NotFound',
        resource: 'PerformanceReport',
        id: testId,
      });
    }
  }

  /**
   * Get performance trends for a subject
   * Requirements: 11.5
   * 
   * Calculates trend data points over time
   * Provides data for chart rendering
   */
  async getPerformanceTrends(
    userId: UserId,
    subject: Subject
  ): Promise<PerformanceTrend[]> {
    // Get all tests for the subject
    const tests = await this.prisma.test.findMany({
      where: {
        userId,
        subject,
        status: 'Submitted',
      },
      include: {
        evaluations: {
          include: {
            topicScores: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc', // Chronological order for trends
      },
    });

    // Build overall subject trend
    const subjectDataPoints: TrendDataPoint[] = tests
      .filter(test => test.evaluations.length > 0)
      .map(test => ({
        date: test.createdAt,
        score: test.evaluations[0].overallScore,
        testId: test.id,
      }));

    const trends: PerformanceTrend[] = [
      {
        subject,
        dataPoints: subjectDataPoints,
      },
    ];

    // Build per-topic trends
    const topicTrendsMap = new Map<TopicId, TrendDataPoint[]>();

    tests.forEach(test => {
      if (test.evaluations.length === 0) return;

      const evaluation = test.evaluations[0];
      
      evaluation.topicScores.forEach(ts => {
        if (!topicTrendsMap.has(ts.topicId)) {
          topicTrendsMap.set(ts.topicId, []);
        }

        topicTrendsMap.get(ts.topicId)!.push({
          date: test.createdAt,
          score: ts.percentage,
          testId: test.id,
        });
      });
    });

    // Add topic trends to result
    topicTrendsMap.forEach((dataPoints, topicId) => {
      trends.push({
        subject,
        topicId,
        dataPoints,
      });
    });

    return trends;
  }

  /**
   * Get performance trends for all subjects
   * Requirements: 11.5
   */
  async getAllPerformanceTrends(userId: UserId): Promise<Map<Subject, PerformanceTrend[]>> {
    // Get all unique subjects for the user
    const tests = await this.prisma.test.findMany({
      where: {
        userId,
        status: 'Submitted',
      },
      select: {
        subject: true,
      },
      distinct: ['subject'],
    });

    const subjects = tests.map(t => t.subject);
    const trendsMap = new Map<Subject, PerformanceTrend[]>();

    // Get trends for each subject
    for (const subject of subjects) {
      const trends = await this.getPerformanceTrends(userId, subject);
      trendsMap.set(subject, trends);
    }

    return trendsMap;
  }

  /**
   * Get summary statistics for a user
   * Requirements: 11.1, 11.2
   */
  async getUserSummary(userId: UserId): Promise<{
    totalTests: number;
    averageScore: number;
    testsBySubject: Map<Subject, number>;
    recentTests: TestHistoryEntry[];
  }> {
    const tests = await this.prisma.test.findMany({
      where: {
        userId,
        status: 'Submitted',
      },
      include: {
        evaluations: true,
      },
    });

    const totalTests = tests.length;
    
    // Calculate average score
    const scores = tests
      .filter(t => t.evaluations.length > 0)
      .map(t => t.evaluations[0].overallScore);
    const averageScore = scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;

    // Count tests by subject
    const testsBySubject = new Map<Subject, number>();
    tests.forEach(test => {
      testsBySubject.set(test.subject, (testsBySubject.get(test.subject) || 0) + 1);
    });

    // Get recent tests (last 5)
    const recentTests = await this.getTestHistory(userId);
    const recentTestsLimited = recentTests.slice(0, 5);

    return {
      totalTests,
      averageScore,
      testsBySubject,
      recentTests: recentTestsLimited,
    };
  }
}
