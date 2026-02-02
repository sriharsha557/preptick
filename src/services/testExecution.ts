// Test Execution Service implementation
// Handles in-app exam test sessions, answer submission, and test completion

import { PrismaClient } from '@prisma/client';
import {
  TestId,
  UserId,
  SessionId,
  QuestionId,
  TestSession,
  UserAnswer,
  TestSubmission,
  Result,
  StartError,
  SubmitError,
  Ok,
  Err,
  Question,
} from '../types';

export class TestExecutionService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Start a test session for in-app exam
   * Requirements: 6.1, 6.2
   * 
   * Creates a new test session with InProgress status
   * Loads test questions for display
   */
  async startTest(
    testId: TestId,
    userId: UserId
  ): Promise<Result<TestSession, StartError>> {
    try {
      // Verify test exists
      const test = await this.prisma.test.findUnique({
        where: { id: testId },
        include: {
          testQuestions: {
            include: {
              question: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
      });

      if (!test) {
        return Err({
          type: 'StartFailed',
          reason: `Test with ID ${testId} not found`,
        });
      }

      // Check if test belongs to user (optional check - can be removed if tests are shareable)
      // For now, we allow any user to take any InAppExam test
      // if (test.userId !== userId) {
      //   return Err({
      //     type: 'StartFailed',
      //     reason: 'Test does not belong to this user',
      //   });
      // }

      // Check if test is in correct mode for in-app exam
      if (test.mode !== 'InAppExam') {
        return Err({
          type: 'StartFailed',
          reason: `Test mode is ${test.mode}, expected InAppExam`,
        });
      }

      // Check if there's already an active session for this test and user
      const existingSession = await this.prisma.testSession.findFirst({
        where: {
          testId,
          userId,
          status: 'InProgress',
        },
        include: {
          responses: true,
        },
      });

      // If active session exists, return it instead of creating a new one
      if (existingSession) {
        const responses = new Map<QuestionId, UserAnswer>();
        existingSession.responses.forEach(r => {
          responses.set(r.questionId, {
            questionId: r.questionId,
            answer: r.userAnswer,
            answeredAt: r.answeredAt,
          });
        });

        return Ok({
          sessionId: existingSession.id,
          testId: existingSession.testId,
          userId: existingSession.userId,
          startedAt: existingSession.startedAt,
          submittedAt: existingSession.submittedAt || undefined,
          responses,
          status: existingSession.status as 'InProgress' | 'Submitted',
        });
      }

      // Create new test session
      const session = await this.prisma.testSession.create({
        data: {
          testId,
          userId,
          status: 'InProgress',
          startedAt: new Date(),
        },
      });

      // Update test status to InProgress if it was Generated
      if (test.status === 'Generated') {
        await this.prisma.test.update({
          where: { id: testId },
          data: { status: 'InProgress' },
        });
      }

      // Return test session with empty responses
      const testSession: TestSession = {
        sessionId: session.id,
        testId: session.testId,
        userId: session.userId,
        startedAt: session.startedAt,
        responses: new Map(),
        status: 'InProgress',
      };

      return Ok(testSession);
    } catch (error) {
      return Err({
        type: 'StartFailed',
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get test session with questions for display
   * Requirements: 6.1, 6.2
   * 
   * Retrieves session and associated questions for rendering
   * Supports both scrollable format and one-at-a-time display
   */
  async getTestSession(
    sessionId: SessionId
  ): Promise<Result<TestSession & { questions: Question[] }, StartError>> {
    try {
      const session = await this.prisma.testSession.findUnique({
        where: { id: sessionId },
        include: {
          responses: true,
          test: {
            include: {
              testQuestions: {
                include: {
                  question: true,
                },
                orderBy: {
                  order: 'asc',
                },
              },
            },
          },
        },
      });

      if (!session) {
        return Err({
          type: 'StartFailed',
          reason: `Session with ID ${sessionId} not found`,
        });
      }

      // Convert responses to Map
      const responses = new Map<QuestionId, UserAnswer>();
      session.responses.forEach(r => {
        responses.set(r.questionId, {
          questionId: r.questionId,
          answer: r.userAnswer,
          answeredAt: r.answeredAt,
        });
      });

      // Convert questions to domain model
      const questions: Question[] = session.test.testQuestions.map(tq => ({
        questionId: tq.question.id,
        topicId: tq.question.topicId,
        questionText: tq.question.questionText,
        questionType: tq.question.questionType as 'MultipleChoice' | 'ShortAnswer' | 'Numerical',
        options: tq.question.options ? JSON.parse(tq.question.options) : undefined,
        // Parse correctAnswers from JSON array and get first answer for compatibility
        correctAnswer: (() => {
          try {
            const parsed = JSON.parse(tq.question.correctAnswers || '[]');
            return Array.isArray(parsed) ? parsed[0] || '' : parsed;
          } catch { return tq.question.correctAnswers || ''; }
        })(),
        syllabusReference: tq.question.syllabusReference,
        difficulty: 'ExamRealistic' as const,
        createdAt: tq.question.createdAt,
      }));

      return Ok({
        sessionId: session.id,
        testId: session.testId,
        userId: session.userId,
        startedAt: session.startedAt,
        submittedAt: session.submittedAt || undefined,
        responses,
        status: session.status as 'InProgress' | 'Submitted',
        questions,
      });
    } catch (error) {
      return Err({
        type: 'StartFailed',
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Submit an answer for a question during the test
   * Requirements: 6.2, 6.3, 6.5
   * 
   * Saves user response with timestamp
   * Allows navigation between questions
   */
  async submitAnswer(
    sessionId: SessionId,
    questionId: QuestionId,
    answer: string
  ): Promise<Result<void, SubmitError>> {
    try {
      // Verify session exists and is in progress
      const session = await this.prisma.testSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return Err({
          type: 'SubmitFailed',
          reason: `Session with ID ${sessionId} not found`,
        });
      }

      if (session.status !== 'InProgress') {
        return Err({
          type: 'SubmitFailed',
          reason: 'Cannot submit answer to a completed test session',
        });
      }

      // Verify question belongs to this test
      const testQuestion = await this.prisma.testQuestion.findFirst({
        where: {
          testId: session.testId,
          questionId,
        },
      });

      if (!testQuestion) {
        return Err({
          type: 'SubmitFailed',
          reason: `Question ${questionId} does not belong to test ${session.testId}`,
        });
      }

      // Upsert the response (allows updating answers during navigation)
      await this.prisma.userResponse.upsert({
        where: {
          sessionId_questionId: {
            sessionId,
            questionId,
          },
        },
        update: {
          userAnswer: answer,
          answeredAt: new Date(),
        },
        create: {
          sessionId,
          questionId,
          userAnswer: answer,
          answeredAt: new Date(),
        },
      });

      return Ok(undefined);
    } catch (error) {
      return Err({
        type: 'SubmitFailed',
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Submit the completed test
   * Requirements: 7.1, 7.2, 7.4
   * 
   * Finalizes test session and prevents further modifications
   * Makes answer key available after submission
   */
  async submitTest(
    sessionId: SessionId
  ): Promise<Result<TestSubmission, SubmitError>> {
    try {
      // Get session with responses
      const session = await this.prisma.testSession.findUnique({
        where: { id: sessionId },
        include: {
          responses: true,
        },
      });

      if (!session) {
        return Err({
          type: 'SubmitFailed',
          reason: `Session with ID ${sessionId} not found`,
        });
      }

      if (session.status === 'Submitted') {
        return Err({
          type: 'SubmitFailed',
          reason: 'Test has already been submitted',
        });
      }

      const submittedAt = new Date();

      // Update session status to Submitted
      await this.prisma.testSession.update({
        where: { id: sessionId },
        data: {
          status: 'Submitted',
          submittedAt,
        },
      });

      // Update test status to Submitted
      await this.prisma.test.update({
        where: { id: session.testId },
        data: {
          status: 'Submitted',
        },
      });

      // Convert responses to Map
      const responses = new Map<QuestionId, UserAnswer>();
      session.responses.forEach(r => {
        responses.set(r.questionId, {
          questionId: r.questionId,
          answer: r.userAnswer,
          answeredAt: r.answeredAt,
        });
      });

      const submission: TestSubmission = {
        sessionId: session.id,
        testId: session.testId,
        responses,
        submittedAt,
      };

      return Ok(submission);
    } catch (error) {
      return Err({
        type: 'SubmitFailed',
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get answer key for a test
   * Requirements: 7.2, 6.4
   * 
   * Only accessible after test submission
   * Prevents access during active test
   */
  async getAnswerKey(
    testId: TestId,
    userId: UserId
  ): Promise<Result<Map<QuestionId, string>, SubmitError>> {
    try {
      // Check if user has a submitted session for this test
      const session = await this.prisma.testSession.findFirst({
        where: {
          testId,
          userId,
        },
      });

      if (!session) {
        return Err({
          type: 'SubmitFailed',
          reason: 'No test session found for this user and test',
        });
      }

      // Requirement 6.4: Prevent access to answer key during active test
      if (session.status !== 'Submitted') {
        return Err({
          type: 'SubmitFailed',
          reason: 'Answer key is only accessible after test submission',
        });
      }

      // Get all questions with correct answers
      const testQuestions = await this.prisma.testQuestion.findMany({
        where: { testId },
        include: {
          question: true,
        },
        orderBy: {
          order: 'asc',
        },
      });

      const answerKey = new Map<QuestionId, string>();
      testQuestions.forEach(tq => {
        // Parse correctAnswers from JSON array and get first answer
        try {
          const parsed = JSON.parse(tq.question.correctAnswers || '[]');
          const answer = Array.isArray(parsed) ? parsed[0] || '' : parsed;
          answerKey.set(tq.question.id, answer);
        } catch {
          answerKey.set(tq.question.id, tq.question.correctAnswers || '');
        }
      });

      return Ok(answerKey);
    } catch (error) {
      return Err({
        type: 'SubmitFailed',
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get user's answers alongside correct answers
   * Requirements: 7.3, 7.5
   * 
   * Displays both user's answers and correct answers side by side
   * Clearly indicates which answers were correct and incorrect
   */
  async getAnswerComparison(
    testId: TestId,
    userId: UserId
  ): Promise<Result<Array<{
    questionId: QuestionId;
    questionText: string;
    userAnswer: string | null;
    correctAnswer: string;
    isCorrect: boolean;
  }>, SubmitError>> {
    try {
      // Verify test is submitted
      const session = await this.prisma.testSession.findFirst({
        where: {
          testId,
          userId,
        },
        include: {
          responses: true,
        },
      });

      if (!session) {
        return Err({
          type: 'SubmitFailed',
          reason: 'No test session found for this user and test',
        });
      }

      if (session.status !== 'Submitted') {
        return Err({
          type: 'SubmitFailed',
          reason: 'Answer comparison is only available after test submission',
        });
      }

      // Get all questions with correct answers
      const testQuestions = await this.prisma.testQuestion.findMany({
        where: { testId },
        include: {
          question: true,
        },
        orderBy: {
          order: 'asc',
        },
      });

      // Create response map for quick lookup
      const responseMap = new Map<QuestionId, string>();
      session.responses.forEach(r => {
        responseMap.set(r.questionId, r.userAnswer);
      });

      // Build comparison array
      const comparison = testQuestions.map(tq => {
        const userAnswer = responseMap.get(tq.question.id) || null;
        // Parse correctAnswers from JSON array
        let correctAnswer: string;
        try {
          const parsed = JSON.parse(tq.question.correctAnswers || '[]');
          correctAnswer = Array.isArray(parsed) ? parsed[0] || '' : parsed;
        } catch {
          correctAnswer = tq.question.correctAnswers || '';
        }
        const isCorrect = userAnswer !== null &&
          this.normalizeAnswer(userAnswer) === this.normalizeAnswer(correctAnswer);

        return {
          questionId: tq.question.id,
          questionText: tq.question.questionText,
          userAnswer,
          correctAnswer,
          isCorrect,
        };
      });

      return Ok(comparison);
    } catch (error) {
      return Err({
        type: 'SubmitFailed',
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Normalize answer for comparison
   * Handles case-insensitive and whitespace-tolerant matching
   * Handles both string and array inputs
   */
  private normalizeAnswer(answer: string | string[]): string {
    // Handle array input - take first element
    const answerStr = Array.isArray(answer) ? (answer[0] || '') : (answer || '');
    // Ensure it's a string before calling trim
    const str = typeof answerStr === 'string' ? answerStr : String(answerStr);
    return str.trim().toLowerCase();
  }
}
