// Feedback Engine implementation
// Generates performance reports and improvement suggestions

import { PrismaClient } from '@prisma/client';
import {
  TestId,
  UserId,
  ReportId,
  TopicId,
  EvaluationResult,
  PerformanceReport,
  WeakTopic,
  ImprovementSuggestion,
  TopicScore,
  MockTest,
  Result,
  Ok,
  Err,
} from '../types';

export class FeedbackEngine {
  private prisma: PrismaClient;
  private readonly WEAK_TOPIC_THRESHOLD = 60; // 60% accuracy threshold

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Identify weak topics from evaluation
   * Requirements: 8.4
   * 
   * Topics with accuracy < 60% are considered weak
   */
  identifyWeakTopics(
    topicScores: TopicScore[],
    threshold: number = this.WEAK_TOPIC_THRESHOLD
  ): WeakTopic[] {
    return topicScores
      .filter(ts => ts.percentage < threshold)
      .map(ts => ({
        topicId: ts.topicId,
        topicName: ts.topicName,
        score: ts.percentage,
        questionsAttempted: ts.total,
        questionsCorrect: ts.correct,
      }));
  }

  /**
   * Generate improvement suggestions for weak topics
   * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
   * 
   * Provides targeted suggestions with syllabus references
   * Offers retry test option
   */
  async generateImprovementSuggestions(
    weakTopics: WeakTopic[]
  ): Promise<ImprovementSuggestion[]> {
    const suggestions: ImprovementSuggestion[] = [];

    for (const weakTopic of weakTopics) {
      // Get syllabus content for the topic
      const topic = await this.prisma.syllabusTopic.findUnique({
        where: { id: weakTopic.topicId },
      });

      if (!topic) {
        continue;
      }

      // Parse learning objectives
      let learningObjectives: string[] = [];
      try {
        learningObjectives = JSON.parse(topic.learningObjectives);
      } catch {
        learningObjectives = [];
      }

      // Generate suggestion
      const suggestion: ImprovementSuggestion = {
        topicId: weakTopic.topicId,
        syllabusSection: topic.syllabusSection,
        conceptsToReview: learningObjectives.length > 0 
          ? learningObjectives 
          : [`Review ${topic.topicName} concepts from ${topic.syllabusSection}`],
        retryTestOption: true, // Always offer retry for weak topics
      };

      suggestions.push(suggestion);
    }

    return suggestions;
  }

  /**
   * Generate complete performance report
   * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
   * 
   * Creates comprehensive report with:
   * - Overall score
   * - Per-topic scores ranked by performance
   * - Identified weak topics
   * - Improvement suggestions
   * - Persists for historical tracking
   */
  async generatePerformanceReport(
    evaluation: EvaluationResult,
    testId: TestId
  ): Promise<Result<PerformanceReport, { type: 'ReportGenerationFailed'; reason: string }>> {
    try {
      const { userId, topicScores } = evaluation;

      // Identify weak topics (< 60% accuracy)
      const weakTopics = this.identifyWeakTopics(topicScores);

      // Generate improvement suggestions
      const suggestions = await this.generateImprovementSuggestions(weakTopics);

      // Rank topics by performance (weakest to strongest)
      const rankedTopicScores = [...topicScores].sort((a, b) => a.percentage - b.percentage);

      // Create report ID
      const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const createdAt = new Date();

      const report: PerformanceReport = {
        reportId,
        testId,
        userId,
        evaluationId: evaluation.evaluationId,
        evaluation: {
          ...evaluation,
          topicScores: rankedTopicScores, // Use ranked scores
        },
        weakTopics,
        suggestions,
        createdAt,
      };

      // Persist report to database
      await this.prisma.performanceReport.create({
        data: {
          id: reportId,
          test: { connect: { id: testId } },
          user: { connect: { id: userId } },
          evaluation: { connect: { id: evaluation.evaluationId } },
          weakTopics: JSON.stringify(weakTopics),
          improvementSuggestions: JSON.stringify(suggestions),
          createdAt,
        },
      });

      return Ok(report);
    } catch (error) {
      return Err({
        type: 'ReportGenerationFailed',
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get performance report for a test
   * Requirements: 9.5
   * 
   * Retrieves persisted performance report
   */
  async getPerformanceReport(
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
      const weakTopics: WeakTopic[] = JSON.parse(report.weakTopics);
      const suggestions: ImprovementSuggestion[] = JSON.parse(report.improvementSuggestions);

      // Build topic scores from evaluation
      const topicScores: TopicScore[] = report.evaluation.topicScores.map(ts => ({
        topicId: ts.topicId,
        topicName: ts.topicName,
        correct: ts.correct,
        total: ts.total,
        percentage: ts.percentage,
      }));

      // Rank topics by performance
      const rankedTopicScores = topicScores.sort((a, b) => a.percentage - b.percentage);

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
          topicScores: rankedTopicScores,
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
   * Check if performance report is accessible
   * Requirements: 9.4
   * 
   * Reports are only accessible after test submission
   */
  async isReportAccessible(testId: TestId): Promise<boolean> {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
    });

    return test?.status === 'Submitted';
  }
}
