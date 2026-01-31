// Feedback Engine tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FeedbackEngine } from './feedbackEngine';
import { PrismaClient } from '@prisma/client';
import { EvaluationResult, TopicScore } from '../types';

// Mock Prisma Client
const mockPrisma = {
  syllabusTopic: {
    findUnique: vi.fn(),
  },
  performanceReport: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  test: {
    findUnique: vi.fn(),
  },
} as unknown as PrismaClient;

describe('FeedbackEngine', () => {
  let feedbackEngine: FeedbackEngine;

  beforeEach(() => {
    feedbackEngine = new FeedbackEngine(mockPrisma);
    vi.clearAllMocks();
  });

  describe('identifyWeakTopics', () => {
    it('should identify topics below 60% threshold', () => {
      const topicScores: TopicScore[] = [
        { topicId: 'topic-1', topicName: 'Algebra', correct: 3, total: 10, percentage: 30 },
        { topicId: 'topic-2', topicName: 'Geometry', correct: 7, total: 10, percentage: 70 },
        { topicId: 'topic-3', topicName: 'Trigonometry', correct: 5, total: 10, percentage: 50 },
      ];

      const weakTopics = feedbackEngine.identifyWeakTopics(topicScores);

      expect(weakTopics).toHaveLength(2);
      expect(weakTopics.find(wt => wt.topicId === 'topic-1')).toBeDefined();
      expect(weakTopics.find(wt => wt.topicId === 'topic-3')).toBeDefined();
      expect(weakTopics.find(wt => wt.topicId === 'topic-2')).toBeUndefined();
    });

    it('should use custom threshold', () => {
      const topicScores: TopicScore[] = [
        { topicId: 'topic-1', topicName: 'Algebra', correct: 7, total: 10, percentage: 70 },
        { topicId: 'topic-2', topicName: 'Geometry', correct: 8, total: 10, percentage: 80 },
      ];

      const weakTopics = feedbackEngine.identifyWeakTopics(topicScores, 75);

      expect(weakTopics).toHaveLength(1);
      expect(weakTopics[0].topicId).toBe('topic-1');
    });

    it('should include all required fields in weak topics', () => {
      const topicScores: TopicScore[] = [
        { topicId: 'topic-1', topicName: 'Algebra', correct: 3, total: 10, percentage: 30 },
      ];

      const weakTopics = feedbackEngine.identifyWeakTopics(topicScores);

      expect(weakTopics[0]).toEqual({
        topicId: 'topic-1',
        topicName: 'Algebra',
        score: 30,
        questionsAttempted: 10,
        questionsCorrect: 3,
      });
    });

    it('should return empty array if no weak topics', () => {
      const topicScores: TopicScore[] = [
        { topicId: 'topic-1', topicName: 'Algebra', correct: 9, total: 10, percentage: 90 },
        { topicId: 'topic-2', topicName: 'Geometry', correct: 8, total: 10, percentage: 80 },
      ];

      const weakTopics = feedbackEngine.identifyWeakTopics(topicScores);

      expect(weakTopics).toHaveLength(0);
    });
  });

  describe('generateImprovementSuggestions', () => {
    it('should generate suggestions for weak topics', async () => {
      const weakTopics = [
        {
          topicId: 'topic-1',
          topicName: 'Algebra',
          score: 30,
          questionsAttempted: 10,
          questionsCorrect: 3,
        },
      ];

      (mockPrisma.syllabusTopic.findUnique as any).mockResolvedValue({
        id: 'topic-1',
        topicName: 'Algebra',
        syllabusSection: 'Chapter 2: Algebraic Expressions',
        learningObjectives: JSON.stringify([
          'Understand variables and constants',
          'Simplify algebraic expressions',
          'Solve linear equations',
        ]),
      });

      const suggestions = await feedbackEngine.generateImprovementSuggestions(weakTopics);

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].topicId).toBe('topic-1');
      expect(suggestions[0].syllabusSection).toBe('Chapter 2: Algebraic Expressions');
      expect(suggestions[0].conceptsToReview).toHaveLength(3);
      expect(suggestions[0].retryTestOption).toBe(true);
    });

    it('should handle topics without learning objectives', async () => {
      const weakTopics = [
        {
          topicId: 'topic-1',
          topicName: 'Algebra',
          score: 30,
          questionsAttempted: 10,
          questionsCorrect: 3,
        },
      ];

      (mockPrisma.syllabusTopic.findUnique as any).mockResolvedValue({
        id: 'topic-1',
        topicName: 'Algebra',
        syllabusSection: 'Chapter 2',
        learningObjectives: '[]',
      });

      const suggestions = await feedbackEngine.generateImprovementSuggestions(weakTopics);

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].conceptsToReview).toHaveLength(1);
      expect(suggestions[0].conceptsToReview[0]).toContain('Algebra');
    });

    it('should skip topics not found in database', async () => {
      const weakTopics = [
        {
          topicId: 'nonexistent',
          topicName: 'Unknown',
          score: 30,
          questionsAttempted: 10,
          questionsCorrect: 3,
        },
      ];

      (mockPrisma.syllabusTopic.findUnique as any).mockResolvedValue(null);

      const suggestions = await feedbackEngine.generateImprovementSuggestions(weakTopics);

      expect(suggestions).toHaveLength(0);
    });
  });

  describe('generatePerformanceReport', () => {
    it('should generate complete performance report', async () => {
      const evaluation: EvaluationResult = {
        evaluationId: 'eval-1',
        testId: 'test-1',
        userId: 'user-1',
        overallScore: 55,
        correctCount: 11,
        totalCount: 20,
        topicScores: [
          { topicId: 'topic-1', topicName: 'Algebra', correct: 3, total: 10, percentage: 30 },
          { topicId: 'topic-2', topicName: 'Geometry', correct: 8, total: 10, percentage: 80 },
        ],
        evaluatedAt: new Date(),
      };

      (mockPrisma.syllabusTopic.findUnique as any).mockResolvedValue({
        id: 'topic-1',
        topicName: 'Algebra',
        syllabusSection: 'Chapter 2',
        learningObjectives: JSON.stringify(['Concept 1', 'Concept 2']),
      });

      (mockPrisma.performanceReport.create as any).mockResolvedValue({});

      const result = await feedbackEngine.generatePerformanceReport(evaluation, 'test-1');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.testId).toBe('test-1');
        expect(result.value.userId).toBe('user-1');
        expect(result.value.weakTopics).toHaveLength(1);
        expect(result.value.weakTopics[0].topicId).toBe('topic-1');
        expect(result.value.suggestions).toHaveLength(1);
        expect(result.value.evaluation.topicScores[0].percentage).toBe(30); // Ranked weakest first
      }
    });

    it('should rank topics by performance', async () => {
      const evaluation: EvaluationResult = {
        evaluationId: 'eval-1',
        testId: 'test-1',
        userId: 'user-1',
        overallScore: 60,
        correctCount: 12,
        totalCount: 20,
        topicScores: [
          { topicId: 'topic-1', topicName: 'Algebra', correct: 8, total: 10, percentage: 80 },
          { topicId: 'topic-2', topicName: 'Geometry', correct: 4, total: 10, percentage: 40 },
        ],
        evaluatedAt: new Date(),
      };

      (mockPrisma.syllabusTopic.findUnique as any).mockResolvedValue({
        id: 'topic-2',
        topicName: 'Geometry',
        syllabusSection: 'Chapter 3',
        learningObjectives: '[]',
      });

      (mockPrisma.performanceReport.create as any).mockResolvedValue({});

      const result = await feedbackEngine.generatePerformanceReport(evaluation, 'test-1');

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Topics should be ranked from weakest to strongest
        expect(result.value.evaluation.topicScores[0].percentage).toBe(40);
        expect(result.value.evaluation.topicScores[1].percentage).toBe(80);
      }
    });
  });

  describe('getPerformanceReport', () => {
    it('should retrieve existing performance report', async () => {
      const mockReport = {
        id: 'report-1',
        testId: 'test-1',
        userId: 'user-1',
        evaluationId: 'eval-1',
        weakTopics: JSON.stringify([
          {
            topicId: 'topic-1',
            topicName: 'Algebra',
            score: 30,
            questionsAttempted: 10,
            questionsCorrect: 3,
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
          overallScore: 55,
          correctCount: 11,
          totalCount: 20,
          evaluatedAt: new Date(),
          topicScores: [
            {
              topicId: 'topic-1',
              topicName: 'Algebra',
              correct: 3,
              total: 10,
              percentage: 30,
            },
          ],
        },
      };

      (mockPrisma.performanceReport.findUnique as any).mockResolvedValue(mockReport);

      const result = await feedbackEngine.getPerformanceReport('test-1');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.reportId).toBe('report-1');
        expect(result.value.weakTopics).toHaveLength(1);
        expect(result.value.suggestions).toHaveLength(1);
      }
    });

    it('should return error if report not found', async () => {
      (mockPrisma.performanceReport.findUnique as any).mockResolvedValue(null);

      const result = await feedbackEngine.getPerformanceReport('nonexistent');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('NotFound');
      }
    });
  });

  describe('isReportAccessible', () => {
    it('should return true for submitted tests', async () => {
      (mockPrisma.test.findUnique as any).mockResolvedValue({
        id: 'test-1',
        status: 'Submitted',
      });

      const accessible = await feedbackEngine.isReportAccessible('test-1');

      expect(accessible).toBe(true);
    });

    it('should return false for in-progress tests', async () => {
      (mockPrisma.test.findUnique as any).mockResolvedValue({
        id: 'test-1',
        status: 'InProgress',
      });

      const accessible = await feedbackEngine.isReportAccessible('test-1');

      expect(accessible).toBe(false);
    });

    it('should return false for generated tests', async () => {
      (mockPrisma.test.findUnique as any).mockResolvedValue({
        id: 'test-1',
        status: 'Generated',
      });

      const accessible = await feedbackEngine.isReportAccessible('test-1');

      expect(accessible).toBe(false);
    });
  });
});
