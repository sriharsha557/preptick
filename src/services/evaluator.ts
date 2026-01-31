// Evaluator Service implementation
// Handles automated test evaluation and scoring

import { PrismaClient } from '@prisma/client';
import {
  TestId,
  UserId,
  EvaluationId,
  QuestionId,
  TopicId,
  EvaluationResult,
  TopicScore,
  TestSubmission,
  QuestionType,
  Result,
  Ok,
  Err,
} from '../types';

export class EvaluatorService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Compare user answer with correct answer
   * Requirements: 8.1
   * 
   * Handles different question types with appropriate comparison logic
   * - Multiple choice: exact match
   * - Short answer: case-insensitive, whitespace-tolerant
   * - Numerical: exact match after normalization
   */
  compareAnswers(
    userAnswer: string,
    correctAnswer: string,
    questionType: QuestionType
  ): boolean {
    const normalizedUser = this.normalizeAnswer(userAnswer);
    const normalizedCorrect = this.normalizeAnswer(correctAnswer);

    switch (questionType) {
      case 'MultipleChoice':
        // Exact match for multiple choice
        return normalizedUser === normalizedCorrect;

      case 'ShortAnswer':
        // Fuzzy matching: case-insensitive, whitespace-tolerant
        return normalizedUser === normalizedCorrect;

      case 'Numerical':
        // Numerical comparison after normalization
        const userNum = parseFloat(normalizedUser);
        const correctNum = parseFloat(normalizedCorrect);
        
        // Check if both are valid numbers
        if (isNaN(userNum) || isNaN(correctNum)) {
          return normalizedUser === normalizedCorrect;
        }
        
        // Allow small floating point tolerance
        return Math.abs(userNum - correctNum) < 0.0001;

      default:
        return normalizedUser === normalizedCorrect;
    }
  }

  /**
   * Normalize answer for comparison
   * Removes extra whitespace and converts to lowercase
   */
  private normalizeAnswer(answer: string): string {
    return answer.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  /**
   * Evaluate a submitted test
   * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
   * 
   * Compares all responses against answer key
   * Calculates overall score and per-topic scores
   * Identifies weak topics (< 60% accuracy)
   * Generates performance report
   */
  async evaluateTest(
    submission: TestSubmission
  ): Promise<Result<EvaluationResult, { type: 'EvaluationFailed'; reason: string }>> {
    try {
      const { testId, userId, responses } = submission;

      // Get test with questions and topics
      const test = await this.prisma.test.findUnique({
        where: { id: testId },
        include: {
          testQuestions: {
            include: {
              question: {
                include: {
                  topic: true,
                },
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
      });

      if (!test) {
        return Err({
          type: 'EvaluationFailed',
          reason: `Test with ID ${testId} not found`,
        });
      }

      // Calculate overall score
      let correctCount = 0;
      const totalCount = test.testQuestions.length;
      const topicScoreMap = new Map<TopicId, { correct: number; total: number; name: string }>();

      // Evaluate each question
      for (const tq of test.testQuestions) {
        const question = tq.question;
        const userResponse = responses.get(question.id);
        const userAnswer = userResponse?.answer || '';
        const correctAnswer = question.correctAnswer;
        const questionType = question.questionType as QuestionType;

        // Compare answers
        const isCorrect = this.compareAnswers(userAnswer, correctAnswer, questionType);
        
        if (isCorrect) {
          correctCount++;
        }

        // Track per-topic scores
        const topicId = question.topicId;
        const topicName = question.topic.topicName;
        
        if (!topicScoreMap.has(topicId)) {
          topicScoreMap.set(topicId, { correct: 0, total: 0, name: topicName });
        }
        
        const topicScore = topicScoreMap.get(topicId)!;
        topicScore.total++;
        if (isCorrect) {
          topicScore.correct++;
        }
      }

      // Calculate overall score percentage
      const overallScore = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;

      // Build topic scores array
      const topicScores: TopicScore[] = Array.from(topicScoreMap.entries()).map(
        ([topicId, data]) => ({
          topicId,
          topicName: data.name,
          correct: data.correct,
          total: data.total,
          percentage: data.total > 0 ? (data.correct / data.total) * 100 : 0,
        })
      );

      // Create evaluation result
      const evaluationId = `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const evaluatedAt = new Date();

      const evaluationResult: EvaluationResult = {
        evaluationId,
        testId,
        userId,
        overallScore,
        correctCount,
        totalCount,
        topicScores,
        evaluatedAt,
      };

      // Persist evaluation to database
      await this.prisma.evaluation.create({
        data: {
          id: evaluationId,
          testId,
          userId,
          overallScore,
          correctCount,
          totalCount,
          evaluatedAt,
          topicScores: {
            create: topicScores.map(ts => ({
              topicId: ts.topicId,
              topicName: ts.topicName,
              correct: ts.correct,
              total: ts.total,
              percentage: ts.percentage,
            })),
          },
        },
      });

      return Ok(evaluationResult);
    } catch (error) {
      return Err({
        type: 'EvaluationFailed',
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get evaluation result for a test
   * Requirements: 8.5
   */
  async getEvaluation(
    testId: TestId
  ): Promise<Result<EvaluationResult, { type: 'NotFound'; resource: string; id: string }>> {
    try {
      const evaluation = await this.prisma.evaluation.findUnique({
        where: { testId },
        include: {
          topicScores: true,
        },
      });

      if (!evaluation) {
        return Err({
          type: 'NotFound',
          resource: 'Evaluation',
          id: testId,
        });
      }

      const topicScores: TopicScore[] = evaluation.topicScores.map(ts => ({
        topicId: ts.topicId,
        topicName: ts.topicName,
        correct: ts.correct,
        total: ts.total,
        percentage: ts.percentage,
      }));

      const result: EvaluationResult = {
        evaluationId: evaluation.id,
        testId: evaluation.testId,
        userId: evaluation.userId,
        overallScore: evaluation.overallScore,
        correctCount: evaluation.correctCount,
        totalCount: evaluation.totalCount,
        topicScores,
        evaluatedAt: evaluation.evaluatedAt,
      };

      return Ok(result);
    } catch (error) {
      return Err({
        type: 'NotFound',
        resource: 'Evaluation',
        id: testId,
      });
    }
  }
}
