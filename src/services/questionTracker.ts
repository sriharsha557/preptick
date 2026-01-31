// Question Tracker Service
// Tracks which questions users have seen and manages retry tests

import { PrismaClient } from '@prisma/client';
import {
  UserId,
  QuestionId,
  TopicId,
  Question,
  Result,
  Ok,
  Err,
} from '../types';

export class QuestionTrackerService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Track that a user has seen a question
   * Requirements: 14.1, 14.3
   * 
   * Records when a user encounters a question in a test
   */
  async trackQuestionSeen(
    userId: UserId,
    questionId: QuestionId
  ): Promise<Result<void, { type: 'TrackingFailed'; reason: string }>> {
    try {
      // Use upsert to avoid duplicates
      await this.prisma.userQuestion.upsert({
        where: {
          userId_questionId: {
            userId,
            questionId,
          },
        },
        update: {
          seenAt: new Date(), // Update timestamp if already exists
        },
        create: {
          userId,
          questionId,
          seenAt: new Date(),
        },
      });

      return Ok(undefined);
    } catch (error) {
      return Err({
        type: 'TrackingFailed',
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Track multiple questions seen by a user
   * Requirements: 14.1, 14.3
   */
  async trackMultipleQuestionsSeen(
    userId: UserId,
    questionIds: QuestionId[]
  ): Promise<Result<void, { type: 'TrackingFailed'; reason: string }>> {
    try {
      // Track each question
      for (const questionId of questionIds) {
        await this.trackQuestionSeen(userId, questionId);
      }

      return Ok(undefined);
    } catch (error) {
      return Err({
        type: 'TrackingFailed',
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get questions the user has already seen
   * Requirements: 14.3
   */
  async getSeenQuestions(userId: UserId): Promise<QuestionId[]> {
    const userQuestions = await this.prisma.userQuestion.findMany({
      where: { userId },
      select: { questionId: true },
    });

    return userQuestions.map(uq => uq.questionId);
  }

  /**
   * Get questions the user has NOT seen for specific topics
   * Requirements: 14.4, 14.5
   * 
   * Prioritizes unseen questions for retry tests
   */
  async getUnseenQuestionsForTopics(
    userId: UserId,
    topicIds: TopicId[]
  ): Promise<Question[]> {
    // Get questions user has seen
    const seenQuestionIds = await this.getSeenQuestions(userId);

    // Get all questions for the topics
    const questions = await this.prisma.question.findMany({
      where: {
        topicId: {
          in: topicIds,
        },
        id: {
          notIn: seenQuestionIds, // Exclude seen questions
        },
      },
      include: {
        topic: true,
      },
    });

    // Convert to domain model
    return questions.map(q => ({
      questionId: q.id,
      topicId: q.topicId,
      questionText: q.questionText,
      questionType: q.questionType as 'MultipleChoice' | 'ShortAnswer' | 'Numerical',
      options: q.options ? JSON.parse(q.options) : undefined,
      correctAnswer: q.correctAnswer,
      syllabusReference: q.syllabusReference,
      difficulty: 'ExamRealistic' as const,
      createdAt: q.createdAt,
    }));
  }

  /**
   * Get questions for retry test with unseen prioritization
   * Requirements: 14.4, 14.5
   * 
   * Returns unseen questions first, then seen questions if needed
   */
  async getQuestionsForRetryTest(
    userId: UserId,
    topicIds: TopicId[],
    count: number
  ): Promise<Result<Question[], { type: 'InsufficientQuestions'; available: number; requested: number }>> {
    try {
      // Get unseen questions first
      const unseenQuestions = await this.getUnseenQuestionsForTopics(userId, topicIds);

      // If we have enough unseen questions, return them
      if (unseenQuestions.length >= count) {
        return Ok(unseenQuestions.slice(0, count));
      }

      // If not enough unseen questions, get seen questions too
      const seenQuestionIds = await this.getSeenQuestions(userId);
      const seenQuestions = await this.prisma.question.findMany({
        where: {
          topicId: {
            in: topicIds,
          },
          id: {
            in: seenQuestionIds,
          },
        },
        include: {
          topic: true,
        },
      });

      const seenQuestionsDomain: Question[] = seenQuestions.map(q => ({
        questionId: q.id,
        topicId: q.topicId,
        questionText: q.questionText,
        questionType: q.questionType as 'MultipleChoice' | 'ShortAnswer' | 'Numerical',
        options: q.options ? JSON.parse(q.options) : undefined,
        correctAnswer: q.correctAnswer,
        syllabusReference: q.syllabusReference,
        difficulty: 'ExamRealistic' as const,
        createdAt: q.createdAt,
      }));

      // Combine unseen and seen questions (unseen first)
      const allQuestions = [...unseenQuestions, ...seenQuestionsDomain];

      if (allQuestions.length < count) {
        return Err({
          type: 'InsufficientQuestions',
          available: allQuestions.length,
          requested: count,
        });
      }

      return Ok(allQuestions.slice(0, count));
    } catch (error) {
      return Err({
        type: 'InsufficientQuestions',
        available: 0,
        requested: count,
      });
    }
  }

  /**
   * Get statistics about question usage for a user
   * Requirements: 14.3
   */
  async getQuestionStats(userId: UserId): Promise<{
    totalSeen: number;
    seenByTopic: Map<TopicId, number>;
  }> {
    const userQuestions = await this.prisma.userQuestion.findMany({
      where: { userId },
      include: {
        question: true,
      },
    });

    const seenByTopic = new Map<TopicId, number>();
    
    userQuestions.forEach(uq => {
      const topicId = uq.question.topicId;
      seenByTopic.set(topicId, (seenByTopic.get(topicId) || 0) + 1);
    });

    return {
      totalSeen: userQuestions.length,
      seenByTopic,
    };
  }
}
