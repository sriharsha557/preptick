// Evaluator Service tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EvaluatorService } from './evaluator';
import { PrismaClient } from '@prisma/client';
import { TestSubmission } from '../types';

// Mock Prisma Client
const mockPrisma = {
  test: {
    findUnique: vi.fn(),
  },
  evaluation: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
} as unknown as PrismaClient;

describe('EvaluatorService', () => {
  let evaluator: EvaluatorService;

  beforeEach(() => {
    evaluator = new EvaluatorService(mockPrisma);
    vi.clearAllMocks();
  });

  describe('compareAnswers', () => {
    it('should match exact answers for multiple choice', () => {
      expect(evaluator.compareAnswers('A', 'A', 'MultipleChoice')).toBe(true);
      expect(evaluator.compareAnswers('B', 'A', 'MultipleChoice')).toBe(false);
    });

    it('should be case-insensitive for multiple choice', () => {
      expect(evaluator.compareAnswers('a', 'A', 'MultipleChoice')).toBe(true);
      expect(evaluator.compareAnswers('A', 'a', 'MultipleChoice')).toBe(true);
    });

    it('should handle whitespace for short answers', () => {
      expect(evaluator.compareAnswers('  hello world  ', 'hello world', 'ShortAnswer')).toBe(true);
      expect(evaluator.compareAnswers('hello  world', 'hello world', 'ShortAnswer')).toBe(true);
    });

    it('should be case-insensitive for short answers', () => {
      expect(evaluator.compareAnswers('Hello World', 'hello world', 'ShortAnswer')).toBe(true);
      expect(evaluator.compareAnswers('HELLO', 'hello', 'ShortAnswer')).toBe(true);
    });

    it('should compare numerical answers with tolerance', () => {
      expect(evaluator.compareAnswers('42', '42', 'Numerical')).toBe(true);
      expect(evaluator.compareAnswers('42.0', '42', 'Numerical')).toBe(true);
      expect(evaluator.compareAnswers('42.00001', '42', 'Numerical')).toBe(true);
      expect(evaluator.compareAnswers('42.1', '42', 'Numerical')).toBe(false);
    });

    it('should handle invalid numerical answers', () => {
      expect(evaluator.compareAnswers('abc', '42', 'Numerical')).toBe(false);
      expect(evaluator.compareAnswers('42', 'abc', 'Numerical')).toBe(false);
    });
  });

  describe('evaluateTest', () => {
    it('should calculate overall score correctly', async () => {
      const testId = 'test-1';
      
      const mockTest = {
        id: testId,
        testQuestions: [
          {
            question: {
              id: 'q1',
              topicId: 'topic-1',
              correctAnswer: 'A',
              questionType: 'MultipleChoice',
              topic: { topicName: 'Algebra' },
            },
          },
          {
            question: {
              id: 'q2',
              topicId: 'topic-1',
              correctAnswer: 'B',
              questionType: 'MultipleChoice',
              topic: { topicName: 'Algebra' },
            },
          },
          {
            question: {
              id: 'q3',
              topicId: 'topic-1',
              correctAnswer: 'C',
              questionType: 'MultipleChoice',
              topic: { topicName: 'Algebra' },
            },
          },
        ],
      };

      (mockPrisma.test.findUnique as any).mockResolvedValue(mockTest);
      (mockPrisma.evaluation.create as any).mockResolvedValue({});

      const submission: TestSubmission = {
        sessionId: 'session-1',
        testId,
        responses: new Map([
          ['q1', { questionId: 'q1', answer: 'A', answeredAt: new Date() }],
          ['q2', { questionId: 'q2', answer: 'B', answeredAt: new Date() }],
          ['q3', { questionId: 'q3', answer: 'X', answeredAt: new Date() }],
        ]),
        submittedAt: new Date(),
      };

      const result = await evaluator.evaluateTest(submission);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.correctCount).toBe(2);
        expect(result.value.totalCount).toBe(3);
        expect(result.value.overallScore).toBeCloseTo(66.67, 1);
      }
    });

    it('should calculate per-topic scores', async () => {
      const testId = 'test-1';
      
      const mockTest = {
        id: testId,
        testQuestions: [
          {
            question: {
              id: 'q1',
              topicId: 'topic-1',
              correctAnswer: 'A',
              questionType: 'MultipleChoice',
              topic: { topicName: 'Algebra' },
            },
          },
          {
            question: {
              id: 'q2',
              topicId: 'topic-1',
              correctAnswer: 'B',
              questionType: 'MultipleChoice',
              topic: { topicName: 'Algebra' },
            },
          },
          {
            question: {
              id: 'q3',
              topicId: 'topic-2',
              correctAnswer: 'C',
              questionType: 'MultipleChoice',
              topic: { topicName: 'Geometry' },
            },
          },
        ],
      };

      (mockPrisma.test.findUnique as any).mockResolvedValue(mockTest);
      (mockPrisma.evaluation.create as any).mockResolvedValue({});

      const submission: TestSubmission = {
        sessionId: 'session-1',
        testId,
        responses: new Map([
          ['q1', { questionId: 'q1', answer: 'A', answeredAt: new Date() }],
          ['q2', { questionId: 'q2', answer: 'X', answeredAt: new Date() }],
          ['q3', { questionId: 'q3', answer: 'C', answeredAt: new Date() }],
        ]),
        submittedAt: new Date(),
      };

      const result = await evaluator.evaluateTest(submission);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.topicScores).toHaveLength(2);
        
        const algebraScore = result.value.topicScores.find(ts => ts.topicId === 'topic-1');
        expect(algebraScore).toBeDefined();
        expect(algebraScore?.correct).toBe(1);
        expect(algebraScore?.total).toBe(2);
        expect(algebraScore?.percentage).toBe(50);

        const geometryScore = result.value.topicScores.find(ts => ts.topicId === 'topic-2');
        expect(geometryScore).toBeDefined();
        expect(geometryScore?.correct).toBe(1);
        expect(geometryScore?.total).toBe(1);
        expect(geometryScore?.percentage).toBe(100);
      }
    });

    it('should handle empty responses', async () => {
      const testId = 'test-1';
      
      const mockTest = {
        id: testId,
        testQuestions: [
          {
            question: {
              id: 'q1',
              topicId: 'topic-1',
              correctAnswer: 'A',
              questionType: 'MultipleChoice',
              topic: { topicName: 'Algebra' },
            },
          },
        ],
      };

      (mockPrisma.test.findUnique as any).mockResolvedValue(mockTest);
      (mockPrisma.evaluation.create as any).mockResolvedValue({});

      const submission: TestSubmission = {
        sessionId: 'session-1',
        testId,
        responses: new Map(), // No responses
        submittedAt: new Date(),
      };

      const result = await evaluator.evaluateTest(submission);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.correctCount).toBe(0);
        expect(result.value.totalCount).toBe(1);
        expect(result.value.overallScore).toBe(0);
      }
    });

    it('should return error if test not found', async () => {
      (mockPrisma.test.findUnique as any).mockResolvedValue(null);

      const submission: TestSubmission = {
        sessionId: 'session-1',
        testId: 'nonexistent',
        responses: new Map(),
        submittedAt: new Date(),
      };

      const result = await evaluator.evaluateTest(submission);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('EvaluationFailed');
      }
    });
  });

  describe('getEvaluation', () => {
    it('should retrieve existing evaluation', async () => {
      const mockEvaluation = {
        id: 'eval-1',
        testId: 'test-1',
        userId: 'user-1',
        overallScore: 75,
        correctCount: 3,
        totalCount: 4,
        evaluatedAt: new Date(),
        topicScores: [
          {
            topicId: 'topic-1',
            topicName: 'Algebra',
            correct: 3,
            total: 4,
            percentage: 75,
          },
        ],
      };

      (mockPrisma.evaluation.findUnique as any).mockResolvedValue(mockEvaluation);

      const result = await evaluator.getEvaluation('test-1');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.evaluationId).toBe('eval-1');
        expect(result.value.overallScore).toBe(75);
        expect(result.value.topicScores).toHaveLength(1);
      }
    });

    it('should return error if evaluation not found', async () => {
      (mockPrisma.evaluation.findUnique as any).mockResolvedValue(null);

      const result = await evaluator.getEvaluation('nonexistent');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('NotFound');
      }
    });
  });

  describe('calculatePartialCredit', () => {
    it('should award full credit when all correct answers selected and no incorrect', () => {
      const userAnswers = ['A', 'B', 'C'];
      const correctAnswers = ['A', 'B', 'C'];
      const points = 1;
      
      const credit = evaluator.calculatePartialCredit(userAnswers, correctAnswers, points);
      expect(credit).toBe(1);
    });

    it('should award zero credit when all answers are incorrect', () => {
      const userAnswers = ['D', 'E'];
      const correctAnswers = ['A', 'B', 'C'];
      const points = 1;
      
      const credit = evaluator.calculatePartialCredit(userAnswers, correctAnswers, points);
      expect(credit).toBe(0);
    });

    it('should calculate partial credit for mixed correct/incorrect', () => {
      const userAnswers = ['A', 'B', 'D']; // 2 correct, 1 incorrect
      const correctAnswers = ['A', 'B', 'C']; // 3 total correct
      const points = 1;
      
      // Formula: max(0, (2 - 1) / 3) * 1 = 1/3 ≈ 0.333
      const credit = evaluator.calculatePartialCredit(userAnswers, correctAnswers, points);
      expect(credit).toBeCloseTo(0.333, 2);
    });

    it('should award zero credit when incorrect selections exceed correct', () => {
      const userAnswers = ['A', 'D', 'E', 'F']; // 1 correct, 3 incorrect
      const correctAnswers = ['A', 'B', 'C']; // 3 total correct
      const points = 1;
      
      // Formula: max(0, (1 - 3) / 3) * 1 = max(0, -2/3) = 0
      const credit = evaluator.calculatePartialCredit(userAnswers, correctAnswers, points);
      expect(credit).toBe(0);
    });

    it('should award zero credit when no answers selected', () => {
      const userAnswers: string[] = [];
      const correctAnswers = ['A', 'B', 'C'];
      const points = 1;
      
      const credit = evaluator.calculatePartialCredit(userAnswers, correctAnswers, points);
      expect(credit).toBe(0);
    });

    it('should scale credit by points value', () => {
      const userAnswers = ['A', 'B'];
      const correctAnswers = ['A', 'B', 'C']; // 2/3 correct
      const points = 3;
      
      // Formula: (2 - 0) / 3 * 3 = 2
      const credit = evaluator.calculatePartialCredit(userAnswers, correctAnswers, points);
      expect(credit).toBe(2);
    });

    it('should be case-insensitive', () => {
      const userAnswers = ['a', 'B', 'c'];
      const correctAnswers = ['A', 'b', 'C'];
      const points = 1;
      
      const credit = evaluator.calculatePartialCredit(userAnswers, correctAnswers, points);
      expect(credit).toBe(1);
    });
  });

  describe('compareAnswers - multiple answer support', () => {
    it('should compare array answers correctly', () => {
      const userAnswers = ['A', 'B', 'C'];
      const correctAnswers = ['A', 'B', 'C'];
      
      expect(evaluator.compareAnswers(userAnswers, correctAnswers, 'MultipleChoice')).toBe(true);
    });

    it('should return false for partial matches', () => {
      const userAnswers = ['A', 'B'];
      const correctAnswers = ['A', 'B', 'C'];
      
      expect(evaluator.compareAnswers(userAnswers, correctAnswers, 'MultipleChoice')).toBe(false);
    });

    it('should return false for incorrect array answers', () => {
      const userAnswers = ['A', 'B', 'D'];
      const correctAnswers = ['A', 'B', 'C'];
      
      expect(evaluator.compareAnswers(userAnswers, correctAnswers, 'MultipleChoice')).toBe(false);
    });

    it('should handle order-independent comparison', () => {
      const userAnswers = ['C', 'A', 'B'];
      const correctAnswers = ['A', 'B', 'C'];
      
      expect(evaluator.compareAnswers(userAnswers, correctAnswers, 'MultipleChoice')).toBe(true);
    });
  });
});
