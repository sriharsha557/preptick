// Question Tracker Service tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuestionTrackerService } from './questionTracker';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
const mockPrisma = {
  userQuestion: {
    upsert: vi.fn(),
    findMany: vi.fn(),
  },
  question: {
    findMany: vi.fn(),
  },
} as unknown as PrismaClient;

describe('QuestionTrackerService', () => {
  let tracker: QuestionTrackerService;

  beforeEach(() => {
    tracker = new QuestionTrackerService(mockPrisma);
    vi.clearAllMocks();
  });

  describe('trackQuestionSeen', () => {
    it('should track a question as seen', async () => {
      (mockPrisma.userQuestion.upsert as any).mockResolvedValue({});

      const result = await tracker.trackQuestionSeen('user-1', 'question-1');

      expect(result.ok).toBe(true);
      expect(mockPrisma.userQuestion.upsert).toHaveBeenCalledWith({
        where: {
          userId_questionId: {
            userId: 'user-1',
            questionId: 'question-1',
          },
        },
        update: expect.any(Object),
        create: expect.any(Object),
      });
    });

    it('should handle errors', async () => {
      (mockPrisma.userQuestion.upsert as any).mockRejectedValue(new Error('Database error'));

      const result = await tracker.trackQuestionSeen('user-1', 'question-1');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('TrackingFailed');
      }
    });
  });

  describe('trackMultipleQuestionsSeen', () => {
    it('should track multiple questions', async () => {
      (mockPrisma.userQuestion.upsert as any).mockResolvedValue({});

      const result = await tracker.trackMultipleQuestionsSeen('user-1', ['q1', 'q2', 'q3']);

      expect(result.ok).toBe(true);
      expect(mockPrisma.userQuestion.upsert).toHaveBeenCalledTimes(3);
    });
  });

  describe('getSeenQuestions', () => {
    it('should return list of seen question IDs', async () => {
      (mockPrisma.userQuestion.findMany as any).mockResolvedValue([
        { questionId: 'q1' },
        { questionId: 'q2' },
        { questionId: 'q3' },
      ]);

      const seenQuestions = await tracker.getSeenQuestions('user-1');

      expect(seenQuestions).toEqual(['q1', 'q2', 'q3']);
    });

    it('should return empty array if no questions seen', async () => {
      (mockPrisma.userQuestion.findMany as any).mockResolvedValue([]);

      const seenQuestions = await tracker.getSeenQuestions('user-1');

      expect(seenQuestions).toEqual([]);
    });
  });

  describe('getUnseenQuestionsForTopics', () => {
    it('should return only unseen questions', async () => {
      // Mock seen questions
      (mockPrisma.userQuestion.findMany as any).mockResolvedValue([
        { questionId: 'q1' },
        { questionId: 'q2' },
      ]);

      // Mock available questions
      (mockPrisma.question.findMany as any).mockResolvedValue([
        {
          id: 'q3',
          topicId: 'topic-1',
          questionText: 'Question 3',
          questionType: 'MultipleChoice',
          options: '["A", "B", "C", "D"]',
          correctAnswer: 'A',
          syllabusReference: 'Section 1',
          createdAt: new Date(),
          topic: { topicName: 'Algebra' },
        },
        {
          id: 'q4',
          topicId: 'topic-1',
          questionText: 'Question 4',
          questionType: 'ShortAnswer',
          options: null,
          correctAnswer: 'Answer',
          syllabusReference: 'Section 2',
          createdAt: new Date(),
          topic: { topicName: 'Algebra' },
        },
      ]);

      const unseenQuestions = await tracker.getUnseenQuestionsForTopics('user-1', ['topic-1']);

      expect(unseenQuestions).toHaveLength(2);
      expect(unseenQuestions[0].questionId).toBe('q3');
      expect(unseenQuestions[1].questionId).toBe('q4');
    });

    it('should return empty array if all questions seen', async () => {
      (mockPrisma.userQuestion.findMany as any).mockResolvedValue([
        { questionId: 'q1' },
        { questionId: 'q2' },
      ]);

      (mockPrisma.question.findMany as any).mockResolvedValue([]);

      const unseenQuestions = await tracker.getUnseenQuestionsForTopics('user-1', ['topic-1']);

      expect(unseenQuestions).toEqual([]);
    });
  });

  describe('getQuestionsForRetryTest', () => {
    it('should prioritize unseen questions', async () => {
      // Mock seen questions
      (mockPrisma.userQuestion.findMany as any).mockResolvedValue([
        { questionId: 'q1' },
      ]);

      // Mock unseen questions
      (mockPrisma.question.findMany as any)
        .mockResolvedValueOnce([
          {
            id: 'q2',
            topicId: 'topic-1',
            questionText: 'Question 2',
            questionType: 'MultipleChoice',
            options: '["A", "B"]',
            correctAnswer: 'A',
            syllabusReference: 'Section 1',
            createdAt: new Date(),
            topic: { topicName: 'Algebra' },
          },
          {
            id: 'q3',
            topicId: 'topic-1',
            questionText: 'Question 3',
            questionType: 'MultipleChoice',
            options: '["A", "B"]',
            correctAnswer: 'B',
            syllabusReference: 'Section 2',
            createdAt: new Date(),
            topic: { topicName: 'Algebra' },
          },
        ]);

      const result = await tracker.getQuestionsForRetryTest('user-1', ['topic-1'], 2);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0].questionId).toBe('q2');
        expect(result.value[1].questionId).toBe('q3');
      }
    });

    it('should include seen questions if not enough unseen', async () => {
      // Mock seen questions
      (mockPrisma.userQuestion.findMany as any).mockResolvedValue([
        { questionId: 'q1' },
      ]);

      // Mock unseen questions (only 1)
      (mockPrisma.question.findMany as any)
        .mockResolvedValueOnce([
          {
            id: 'q2',
            topicId: 'topic-1',
            questionText: 'Question 2',
            questionType: 'MultipleChoice',
            options: '["A", "B"]',
            correctAnswer: 'A',
            syllabusReference: 'Section 1',
            createdAt: new Date(),
            topic: { topicName: 'Algebra' },
          },
        ])
        // Mock seen questions
        .mockResolvedValueOnce([
          {
            id: 'q1',
            topicId: 'topic-1',
            questionText: 'Question 1',
            questionType: 'MultipleChoice',
            options: '["A", "B"]',
            correctAnswer: 'A',
            syllabusReference: 'Section 1',
            createdAt: new Date(),
            topic: { topicName: 'Algebra' },
          },
        ]);

      const result = await tracker.getQuestionsForRetryTest('user-1', ['topic-1'], 2);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
        // Unseen question should come first
        expect(result.value[0].questionId).toBe('q2');
        // Then seen question
        expect(result.value[1].questionId).toBe('q1');
      }
    });

    it('should return error if insufficient questions', async () => {
      (mockPrisma.userQuestion.findMany as any).mockResolvedValue([]);
      
      // Mock unseen questions (1 question)
      (mockPrisma.question.findMany as any)
        .mockResolvedValueOnce([
          {
            id: 'q1',
            topicId: 'topic-1',
            questionText: 'Question 1',
            questionType: 'MultipleChoice',
            options: '["A", "B"]',
            correctAnswer: 'A',
            syllabusReference: 'Section 1',
            createdAt: new Date(),
            topic: { topicName: 'Algebra' },
          },
        ])
        // Mock seen questions (empty since user hasn't seen any)
        .mockResolvedValueOnce([]);

      const result = await tracker.getQuestionsForRetryTest('user-1', ['topic-1'], 5);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('InsufficientQuestions');
        expect(result.error.available).toBe(1);
        expect(result.error.requested).toBe(5);
      }
    });
  });

  describe('getQuestionStats', () => {
    it('should return question statistics', async () => {
      (mockPrisma.userQuestion.findMany as any).mockResolvedValue([
        { questionId: 'q1', question: { topicId: 'topic-1' } },
        { questionId: 'q2', question: { topicId: 'topic-1' } },
        { questionId: 'q3', question: { topicId: 'topic-2' } },
      ]);

      const stats = await tracker.getQuestionStats('user-1');

      expect(stats.totalSeen).toBe(3);
      expect(stats.seenByTopic.get('topic-1')).toBe(2);
      expect(stats.seenByTopic.get('topic-2')).toBe(1);
    });

    it('should return zero stats for new user', async () => {
      (mockPrisma.userQuestion.findMany as any).mockResolvedValue([]);

      const stats = await tracker.getQuestionStats('user-1');

      expect(stats.totalSeen).toBe(0);
      expect(stats.seenByTopic.size).toBe(0);
    });
  });
});
