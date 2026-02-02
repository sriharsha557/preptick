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
   * Requirements: 8.1, P2 4.2
   * 
   * Handles different question types with appropriate comparison logic
   * - Multiple choice: exact match (single answer) or array comparison (multiple answers)
   * - Short answer: case-insensitive, whitespace-tolerant
   * - Numerical: exact match after normalization
   */
  compareAnswers(
    userAnswer: string | string[],
    correctAnswer: string | string[],
    questionType: QuestionType
  ): boolean {
    // Handle array answers for multiple-answer questions
    if (Array.isArray(correctAnswer)) {
      const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
      return this.compareArrayAnswers(userAnswers, correctAnswer);
    }

    // Single answer comparison
    const userStr = Array.isArray(userAnswer) ? userAnswer[0] || '' : userAnswer;
    const correctStr = Array.isArray(correctAnswer) ? correctAnswer[0] || '' : correctAnswer;
    
    const normalizedUser = this.normalizeAnswer(userStr);
    const normalizedCorrect = this.normalizeAnswer(correctStr);

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
   * Compare array answers for multiple-answer questions
   * Requirements: P2 4.2
   * 
   * Returns true only if all correct answers are selected and no incorrect answers
   */
  private compareArrayAnswers(userAnswers: string[], correctAnswers: string[]): boolean {
    const normalizedUser = userAnswers.map(a => this.normalizeAnswer(a)).sort();
    const normalizedCorrect = correctAnswers.map(a => this.normalizeAnswer(a)).sort();
    
    if (normalizedUser.length !== normalizedCorrect.length) {
      return false;
    }
    
    return normalizedUser.every((answer, index) => answer === normalizedCorrect[index]);
  }

  /**
   * Calculate partial credit for multiple-answer questions
   * Requirements: P2 4.2, 4.6
   * 
   * Formula: max(0, (correct_selections - incorrect_selections) / total_correct_answers) * points
   * 
   * @param userAnswers - Array of user-selected answers
   * @param correctAnswers - Array of correct answers
   * @param points - Total points for the question
   * @returns Points earned (0 to points)
   */
  calculatePartialCredit(
    userAnswers: string[],
    correctAnswers: string[],
    points: number = 1
  ): number {
    const normalizedUser = userAnswers.map(a => this.normalizeAnswer(a));
    const normalizedCorrect = correctAnswers.map(a => this.normalizeAnswer(a));
    
    // Count correct and incorrect selections
    let correctSelections = 0;
    let incorrectSelections = 0;
    
    for (const answer of normalizedUser) {
      if (normalizedCorrect.includes(answer)) {
        correctSelections++;
      } else {
        incorrectSelections++;
      }
    }
    
    // Calculate partial credit using the formula
    const totalCorrect = normalizedCorrect.length;
    const creditRatio = Math.max(0, (correctSelections - incorrectSelections) / totalCorrect);
    
    return creditRatio * points;
  }

  /**
   * Normalize answer for comparison
   * Removes extra whitespace and converts to lowercase
   * Handles both string and array inputs
   */
  private normalizeAnswer(answer: string | string[]): string {
    // Handle array input - take first element or join
    const answerStr = Array.isArray(answer) ? (answer[0] || '') : (answer || '');
    // Ensure it's a string before calling trim
    const str = typeof answerStr === 'string' ? answerStr : String(answerStr);
    return str.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  /**
   * Evaluate a submitted test
   * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, P2 4.2, 4.6
   * 
   * Compares all responses against answer key
   * Calculates overall score and per-topic scores
   * Supports partial credit for multiple-answer questions
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
      let totalPoints = 0;
      let earnedPoints = 0;
      const totalCount = test.testQuestions.length;
      const topicScoreMap = new Map<TopicId, { correct: number; total: number; name: string; points: number; earned: number }>();

      // Evaluate each question
      for (const tq of test.testQuestions) {
        const question = tq.question;
        const userResponse = responses.get(question.id);
        const userAnswer = userResponse?.answer || '';
        // Database field is 'correctAnswers' (plural, JSON array)
        const correctAnswers = question.correctAnswers || '[]';
        const questionType = question.questionType as QuestionType;
        const questionPoints = 1; // Default 1 point per question

        totalPoints += questionPoints;

        // Handle multiple-answer questions with partial credit
        let isCorrect = false;
        let pointsEarned = 0;

        // Parse correctAnswers from JSON array
        let correctAnswerParsed: string | string[];
        try {
          correctAnswerParsed = JSON.parse(correctAnswers);
        } catch {
          correctAnswerParsed = correctAnswers;
        }

        // Parse user answer if it's JSON
        let userAnswerParsed: string | string[];
        try {
          userAnswerParsed = JSON.parse(userAnswer);
        } catch {
          userAnswerParsed = userAnswer;
        }

        // Evaluate based on answer type
        if (Array.isArray(correctAnswerParsed)) {
          // Multiple-answer question - calculate partial credit
          const userAnswers = Array.isArray(userAnswerParsed) ? userAnswerParsed : [userAnswerParsed];
          pointsEarned = this.calculatePartialCredit(userAnswers, correctAnswerParsed, questionPoints);
          isCorrect = pointsEarned === questionPoints; // Full credit means correct
        } else {
          // Single-answer question - binary correct/incorrect
          isCorrect = this.compareAnswers(userAnswerParsed, correctAnswerParsed, questionType);
          pointsEarned = isCorrect ? questionPoints : 0;
        }

        earnedPoints += pointsEarned;
        
        if (isCorrect) {
          correctCount++;
        }

        // Track per-topic scores
        const topicId = question.topicId;
        const topicName = question.topic.topicName;
        
        if (!topicScoreMap.has(topicId)) {
          topicScoreMap.set(topicId, { correct: 0, total: 0, name: topicName, points: 0, earned: 0 });
        }
        
        const topicScore = topicScoreMap.get(topicId)!;
        topicScore.total++;
        topicScore.points += questionPoints;
        topicScore.earned += pointsEarned;
        if (isCorrect) {
          topicScore.correct++;
        }
      }

      // Calculate overall score percentage based on points
      const overallScore = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

      // Build topic scores array
      const topicScores: TopicScore[] = Array.from(topicScoreMap.entries()).map(
        ([topicId, data]) => ({
          topicId,
          topicName: data.name,
          correct: data.correct,
          total: data.total,
          percentage: data.points > 0 ? (data.earned / data.points) * 100 : 0,
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
