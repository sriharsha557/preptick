// Test API routes

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma, getPoolMetrics, logPoolWarning } from '../lib/db';
import { TestGeneratorService } from '../services/testGenerator';
import { TestExecutionService } from '../services/testExecution';
import { EvaluatorService } from '../services/evaluator';
import { FeedbackEngine } from '../services/feedbackEngine';
import { PerformanceHistoryService } from '../services/performanceHistory';
import { RAGRetrieverImpl } from '../services/ragRetriever';
import { LLMQuestionGeneratorService } from '../services/llmQuestionGenerator';
import { generatePDF, generateQuestionPaper, generateAnswerKey } from '../services/pdfGenerator';
import { MockTest, Question, TestConfiguration, StudentMetadata } from '../types';
import { GroqEmbeddingService } from '../services/embedding';
import { InMemoryVectorStore } from '../services/vectorStore';
import {
  generateTestSchema,
  submitAnswerSchema,
  submitTestSchema,
  startTestSchema,
  retryTestSchema,
  formatZodErrors,
  type GenerateTestInput,
  type SubmitAnswerInput,
} from '../lib/validators';

// Type definitions for request bodies
interface SubmitAnswerBody {
  questionId: string;
  answer: string;
}

interface SubmitTestBody {
  sessionId: string;
}

// Initialize services
const embeddingService = process.env.GROQ_API_KEY
  ? new GroqEmbeddingService(process.env.GROQ_API_KEY)
  : new GroqEmbeddingService('dummy-key'); // Fallback for when GROQ is not available
const vectorStore = new InMemoryVectorStore();
const ragRetriever = new RAGRetrieverImpl(prisma, embeddingService, vectorStore);
const llmGenerator = process.env.GROQ_API_KEY
  ? new LLMQuestionGeneratorService(process.env.GROQ_API_KEY)
  : undefined;
const testGenerator = new TestGeneratorService(prisma, ragRetriever, llmGenerator);
const testExecution = new TestExecutionService(prisma);
const evaluator = new EvaluatorService(prisma);
const feedbackEngine = new FeedbackEngine(prisma);
const performanceHistory = new PerformanceHistoryService(prisma);

/**
 * Retry helper with exponential backoff
 * Requirements: P2 Requirement 3.3
 * 
 * Retries database operations up to 3 times with exponential backoff:
 * - 1st retry: 100ms delay
 * - 2nd retry: 200ms delay
 * - 3rd retry: 400ms delay
 */
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  operationName: string = 'Database operation'
): Promise<T> {
  const delays = [100, 200, 400]; // Exponential backoff delays in milliseconds
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Validate connection pool before attempting operation
      // Requirements: P2 Requirement 3.1
      const metrics = await getPoolMetrics();
      logPoolWarning(metrics);

      if (metrics.utilizationPercent >= 100) {
        throw new Error('Connection pool exhausted');
      }

      // Execute the operation
      const startTime = Date.now();
      const result = await operation();
      const duration = Date.now() - startTime;

      // Log if operation took longer than expected
      if (duration > 100) {
        console.warn(`[Retry Helper] ${operationName} took ${duration}ms (expected <100ms)`);
      }

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if error is connection-related
      const isConnectionError = 
        lastError.message.includes('connection') ||
        lastError.message.includes('timeout') ||
        lastError.message.includes('pool') ||
        lastError.message.includes('ECONNREFUSED') ||
        lastError.message.includes('ETIMEDOUT');

      // If not a connection error or we've exhausted retries, throw immediately
      if (!isConnectionError || attempt >= maxRetries) {
        console.error(`[Retry Helper] ${operationName} failed after ${attempt + 1} attempts:`, lastError.message);
        throw lastError;
      }

      // Log retry attempt
      const delay = delays[attempt];
      console.warn(`[Retry Helper] ${operationName} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`, {
        error: lastError.message,
        attempt: attempt + 1,
        maxRetries: maxRetries + 1,
      });

      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error(`${operationName} failed after ${maxRetries + 1} attempts`);
}

/**
 * Submit test with retry logic
 * Requirements: P2 Requirements 3.1, 3.3, 3.4
 * 
 * Wraps test submission with connection validation and retry logic
 */
async function submitTestWithRetry(sessionId: string) {
  return retryWithBackoff(async () => {
    // Submit test
    const submitResult = await testExecution.submitTest(sessionId);

    if (!submitResult.ok) {
      throw new Error(submitResult.error.reason);
    }

    const submission = submitResult.value;

    // Evaluate test
    const evalResult = await evaluator.evaluateTest(submission);

    if (!evalResult.ok) {
      throw new Error(evalResult.error.reason);
    }

    const evaluation = evalResult.value;

    // Generate performance report
    const report = await feedbackEngine.generatePerformanceReport(evaluation, submission.testId);

    return {
      submission,
      evaluation,
      report,
    };
  }, 3, 'Test submission');
}

export async function testRoutes(fastify: FastifyInstance) {
  // Generate new test
  fastify.post('/api/tests/generate', async (
    request: FastifyRequest<{ Body: GenerateTestInput }>,
    reply: FastifyReply
  ) => {
    try {
      // Validate request body
      const validation = generateTestSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({
          error: 'Validation failed',
          message: formatZodErrors(validation.error),
        });
      }

      const { userId, subject, topics, questionCount, testCount, testMode } = validation.data;

      // Ensure user exists in database before generating test
      // This handles cases where user authenticated via Supabase but doesn't exist in Prisma
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!userExists) {
        // Try to create user with defaults (they should re-login to get proper profile)
        try {
          await prisma.user.create({
            data: {
              id: userId,
              email: `user-${userId.substring(0, 8)}@temp.local`, // Temporary email
              passwordHash: '',
              curriculum: 'CBSE',
              grade: 10,
              subjects: JSON.stringify(['Mathematics']),
              createdAt: new Date(),
              lastLogin: new Date(),
            },
          });
          fastify.log.info(`Created temporary user record for userId: ${userId}`);
        } catch (createError) {
          // If user creation fails (e.g., email conflict), return helpful error
          fastify.log.error('Failed to create user:', createError);
          return reply.status(400).send({
            error: 'User not found',
            message: 'Please log out and log back in to sync your account.',
          });
        }
      }

      // Create test configuration
      const config = {
        subject,
        topics,
        questionCount,
        testCount,
        testMode,
      };

      // Generate tests
      const result = await testGenerator.generateTests(config, userId);

      if (!result.ok) {
        return reply.status(400).send({
          error: 'Test generation failed',
          message: result.error.type,
          details: result.error,
        });
      }

      const tests = result.value;

      return reply.send({
        success: true,
        tests: tests.map(test => ({
          testId: test.testId,
          questionCount: test.questions.length,
          topics: test.configuration.topics,
          createdAt: test.createdAt,
        })),
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get test by ID
  fastify.get('/api/tests/:testId', async (
    request: FastifyRequest<{ Params: { testId: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { testId } = request.params;

      const test = await prisma.test.findUnique({
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
        return reply.status(404).send({
          error: 'Test not found',
          message: `Test with ID ${testId} not found`,
        });
      }

      return reply.send({
        testId: test.id,
        userId: test.userId,
        subject: test.subject,
        status: test.status,
        mode: test.mode,
        createdAt: test.createdAt,
        questions: test.testQuestions.map(tq => ({
          questionId: tq.question.id,
          questionText: tq.question.questionText,
          questionType: tq.question.questionType,
          options: tq.question.options ? JSON.parse(tq.question.options) : null,
          topicId: tq.question.topicId,
          topicName: tq.question.topic.topicName,
          syllabusReference: tq.question.syllabusReference,
        })),
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Start test session
  fastify.post('/api/tests/:testId/start', async (
    request: FastifyRequest<{ 
      Params: { testId: string };
      Body: { userId: string };
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { testId } = request.params;
      const { userId } = request.body;

      if (!userId) {
        return reply.status(400).send({
          error: 'Invalid request',
          message: 'userId is required',
        });
      }

      const result = await testExecution.startTest(testId, userId);

      if (!result.ok) {
        return reply.status(400).send({
          error: 'Failed to start test',
          message: result.error.reason,
        });
      }

      const session = result.value;

      return reply.send({
        sessionId: session.sessionId,
        testId: session.testId,
        startedAt: session.startedAt,
        status: session.status,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get test session with questions
  fastify.get('/api/tests/session/:sessionId', async (
    request: FastifyRequest<{ Params: { sessionId: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { sessionId } = request.params;

      const result = await testExecution.getTestSession(sessionId);

      if (!result.ok) {
        return reply.status(404).send({
          error: 'Session not found',
          message: result.error.reason,
        });
      }

      const session = result.value;

      return reply.send({
        sessionId: session.sessionId,
        testId: session.testId,
        userId: session.userId,
        startedAt: session.startedAt,
        submittedAt: session.submittedAt,
        status: session.status,
        questions: session.questions.map(q => ({
          questionId: q.questionId,
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options,
          topicId: q.topicId,
          syllabusReference: q.syllabusReference,
        })),
        responses: Array.from(session.responses.entries()).map(([questionId, answer]) => ({
          questionId,
          answer: answer.answer,
          answeredAt: answer.answeredAt,
        })),
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Submit answer for a question
  fastify.post('/api/tests/session/:sessionId/answer', async (
    request: FastifyRequest<{ 
      Params: { sessionId: string };
      Body: SubmitAnswerBody;
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { sessionId } = request.params;
      const { questionId, answer } = request.body;

      if (!questionId || answer === undefined) {
        return reply.status(400).send({
          error: 'Invalid request',
          message: 'questionId and answer are required',
        });
      }

      const result = await testExecution.submitAnswer(sessionId, questionId, answer);

      if (!result.ok) {
        return reply.status(400).send({
          error: 'Failed to submit answer',
          message: result.error.reason,
        });
      }

      return reply.send({
        success: true,
        message: 'Answer submitted successfully',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Submit completed test
  fastify.post('/api/tests/submit', async (
    request: FastifyRequest<{ Body: SubmitTestBody }>,
    reply: FastifyReply
  ) => {
    try {
      const { sessionId } = request.body;

      if (!sessionId) {
        return reply.status(400).send({
          error: 'Invalid request',
          message: 'sessionId is required',
        });
      }

      // Submit test with retry logic
      // Requirements: P2 Requirements 3.1, 3.3, 3.4
      const result = await submitTestWithRetry(sessionId);

      return reply.send({
        success: true,
        testId: result.submission.testId,
        submittedAt: result.submission.submittedAt,
        evaluation: {
          evaluationId: result.evaluation.evaluationId,
          overallScore: result.evaluation.overallScore,
          correctCount: result.evaluation.correctCount,
          totalCount: result.evaluation.totalCount,
          topicScores: result.evaluation.topicScores,
        },
        report: {
          reportId: result.report.reportId,
          weakTopics: result.report.weakTopics,
          suggestions: result.report.suggestions,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      
      // Check if error is connection-related
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isConnectionError = 
        errorMessage.includes('connection') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('pool');

      // Return 503 for connection pool issues (Requirement 3.5)
      if (isConnectionError) {
        return reply.status(503).send({
          error: 'Service temporarily unavailable',
          message: 'Database connection pool is currently unavailable. Please try again in a moment.',
        });
      }

      return reply.status(500).send({
        error: 'Internal server error',
        message: errorMessage,
      });
    }
  });

  // Get test results
  fastify.get('/api/tests/:testId/results', async (
    request: FastifyRequest<{ 
      Params: { testId: string };
      Querystring: { userId: string };
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { testId } = request.params;
      const { userId } = request.query;

      if (!userId) {
        return reply.status(400).send({
          error: 'Invalid request',
          message: 'userId query parameter is required',
        });
      }

      // Get evaluation
      const evalResult = await evaluator.getEvaluation(testId);

      if (!evalResult.ok) {
        return reply.status(404).send({
          error: 'Evaluation not found',
          message: 'Test has not been evaluated yet',
        });
      }

      const evaluation = evalResult.value;

      // Get performance report
      const reportResult = await performanceHistory.getHistoricalPerformanceReport(testId);

      if (!reportResult.ok) {
        return reply.status(404).send({
          error: 'Report not found',
          message: 'Performance report not found',
        });
      }

      const report = reportResult.value;

      // Get answer comparison
      const comparisonResult = await testExecution.getAnswerComparison(testId, userId);

      if (!comparisonResult.ok) {
        return reply.status(400).send({
          error: 'Failed to get answer comparison',
          message: comparisonResult.error.reason,
        });
      }

      const comparison = comparisonResult.value;

      return reply.send({
        evaluation: {
          evaluationId: evaluation.evaluationId,
          overallScore: evaluation.overallScore,
          correctCount: evaluation.correctCount,
          totalCount: evaluation.totalCount,
          topicScores: evaluation.topicScores,
          evaluatedAt: evaluation.evaluatedAt,
        },
        report: {
          reportId: report.reportId,
          weakTopics: report.weakTopics,
          suggestions: report.suggestions,
          generatedAt: report.generatedAt,
        },
        questions: comparison,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get test history for user
  fastify.get('/api/tests/history/:userId', async (
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { userId } = request.params;

      const history = await performanceHistory.getTestHistory(userId);

      return reply.send({
        tests: history,
        totalTests: history.length,
        averageScore: history.length > 0
          ? history.reduce((sum, t) => sum + (t.score || 0), 0) / history.length
          : 0,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Download test PDF
  fastify.get('/api/tests/:testId/pdf', async (
    request: FastifyRequest<{ 
      Params: { testId: string };
      Querystring: { includeAnswers?: string };
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { testId } = request.params;
      const includeAnswers = request.query.includeAnswers === 'true';

      // Get test with questions
      const test = await prisma.test.findUnique({
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
        return reply.status(404).send({
          error: 'Test not found',
          message: `Test with ID ${testId} not found`,
        });
      }

      // Convert to MockTest format
      const mockTest = {
        testId: test.id,
        configuration: {
          subject: test.subject,
          topics: JSON.parse(test.topics),
          questionCount: test.testQuestions.length,
          testCount: 1,
          testMode: test.mode as 'InAppExam' | 'PDFDownload',
        },
        questions: test.testQuestions.map(tq => ({
          questionId: tq.question.id,
          topicId: tq.question.topicId,
          questionText: tq.question.questionText,
          questionType: tq.question.questionType as 'MultipleChoice' | 'ShortAnswer' | 'Numerical',
          options: tq.question.options ? JSON.parse(tq.question.options) : undefined,
          // Parse correctAnswers from JSON array
          correctAnswer: (() => {
            try {
              const parsed = JSON.parse(tq.question.correctAnswers || '[]');
              return Array.isArray(parsed) ? parsed[0] || '' : parsed;
            } catch { return tq.question.correctAnswers || ''; }
          })(),
          syllabusReference: tq.question.syllabusReference,
          difficulty: 'ExamRealistic' as const,
          createdAt: tq.question.createdAt,
        })),
        answerKey: new Map(
          test.testQuestions.map(tq => {
            try {
              const parsed = JSON.parse(tq.question.correctAnswers || '[]');
              return [tq.question.id, Array.isArray(parsed) ? parsed[0] || '' : parsed];
            } catch { return [tq.question.id, tq.question.correctAnswers || '']; }
          })
        ),
        createdAt: test.createdAt,
      };

      // Generate PDF
      const result = await generatePDF(mockTest, includeAnswers);

      if (!result.ok) {
        return reply.status(400).send({
          error: 'Failed to generate PDF',
          message: result.error.reason,
        });
      }

      const pdfDoc = result.value;

      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', `attachment; filename="${pdfDoc.filename}"`);
      return reply.send(pdfDoc.buffer);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Download question paper PDF (without answers)
  // Requirements: 3.5, 9 (Student Personalization)
  fastify.get('/api/tests/:testId/download/questions', async (
    request: FastifyRequest<{
      Params: { testId: string };
      Querystring: { studentName?: string; grade?: string };
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { testId } = request.params;
      const { studentName, grade } = request.query;

      // Get test from database with questions for PDF regeneration
      const test = await prisma.test.findUnique({
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
        return reply.status(404).send({
          error: 'Test not found',
          message: `Test with ID ${testId} not found`,
        });
      }

      // If student metadata provided, regenerate PDF with personalization (Requirement 9)
      if (studentName || grade) {
        // Parse topic IDs from stored JSON
        const topicIds = JSON.parse(test.topics || '[]');
        
        // Fetch actual topic names from database
        const topicsFromDb = await prisma.topic.findMany({
          where: { id: { in: topicIds } },
          select: { id: true, topicName: true },
        });
        
        // Create map of topic ID to name
        const topicMap = new Map(topicsFromDb.map(t => [t.id, t.topicName]));
        
        // Get topic names in order
        const topics = topicIds.map((id: string) => topicMap.get(id) || id);

        // Build questions array for PDF generation
        const questions: Question[] = test.testQuestions.map(tq => ({
          questionId: tq.question.id,
          topicId: tq.question.topicId,
          questionText: tq.question.questionText,
          questionType: tq.question.questionType as 'MultipleChoice' | 'ShortAnswer' | 'Numerical',
          options: tq.question.options ? JSON.parse(tq.question.options) : undefined,
          correctAnswer: (() => {
            try {
              const parsed = JSON.parse(tq.question.correctAnswers || '[]');
              return Array.isArray(parsed) ? parsed[0] || '' : parsed;
            } catch { return tq.question.correctAnswers || ''; }
          })(),
          solutionSteps: tq.question.solutionSteps ? JSON.parse(tq.question.solutionSteps) : undefined,
          syllabusReference: tq.question.syllabusReference || '',
          difficulty: 'ExamRealistic' as const,
          createdAt: tq.question.createdAt,
        }));

        // Build mock test object for PDF generation
        const mockTest: MockTest = {
          testId: test.id,
          configuration: {
            subject: test.subject,
            topics: topics,
            questionCount: questions.length,
            testCount: 1,
            testMode: test.mode as 'InAppExam' | 'PDFDownload',
          },
          questions,
          answerKey: new Map(questions.map(q => [q.questionId, q.correctAnswer])),
          createdAt: test.createdAt,
        };

        // Build student metadata
        const studentMetadata: StudentMetadata = {
          name: studentName,
          grade: grade,
          date: new Date().toISOString().split('T')[0],
          testId: testId,
        };

        // Regenerate PDF with student metadata
        const pdfResult = await generateQuestionPaper(mockTest, topics, studentMetadata);

        if (!pdfResult.ok) {
          return reply.status(500).send({
            error: 'PDF generation failed',
            message: pdfResult.error.reason,
          });
        }

        reply.header('Content-Type', 'application/pdf');
        reply.header('Content-Disposition', `attachment; filename="test-${testId}-questions.pdf"`);
        return reply.send(pdfResult.value.buffer);
      }

      // No student metadata - return stored PDF
      if (!test.questionPaperPDF) {
        return reply.status(404).send({
          error: 'PDF not found',
          message: 'Question paper PDF not available for this test',
        });
      }

      // Set headers for PDF download
      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', `attachment; filename="test-${testId}-questions.pdf"`);

      return reply.send(test.questionPaperPDF);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Download answer key PDF (with answers and solutions)
  // Requirements: 3.6, 9 (Student Personalization)
  fastify.get('/api/tests/:testId/download/answers', async (
    request: FastifyRequest<{
      Params: { testId: string };
      Querystring: { studentName?: string; grade?: string };
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { testId } = request.params;
      const { studentName, grade } = request.query;

      // Get test from database with questions for PDF regeneration
      const test = await prisma.test.findUnique({
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
        return reply.status(404).send({
          error: 'Test not found',
          message: `Test with ID ${testId} not found`,
        });
      }

      // If student metadata provided, regenerate PDF with personalization (Requirement 9)
      if (studentName || grade) {
        // Parse topic IDs from stored JSON
        const topicIds = JSON.parse(test.topics || '[]');
        
        // Fetch actual topic names from database
        const topicsFromDb = await prisma.topic.findMany({
          where: { id: { in: topicIds } },
          select: { id: true, topicName: true },
        });
        
        // Create map of topic ID to name
        const topicMap = new Map(topicsFromDb.map(t => [t.id, t.topicName]));
        
        // Get topic names in order
        const topics = topicIds.map((id: string) => topicMap.get(id) || id);

        // Build questions array for PDF generation
        const questions: Question[] = test.testQuestions.map(tq => ({
          questionId: tq.question.id,
          topicId: tq.question.topicId,
          questionText: tq.question.questionText,
          questionType: tq.question.questionType as 'MultipleChoice' | 'ShortAnswer' | 'Numerical',
          options: tq.question.options ? JSON.parse(tq.question.options) : undefined,
          correctAnswer: (() => {
            try {
              const parsed = JSON.parse(tq.question.correctAnswers || '[]');
              return Array.isArray(parsed) ? parsed[0] || '' : parsed;
            } catch { return tq.question.correctAnswers || ''; }
          })(),
          solutionSteps: tq.question.solutionSteps ? JSON.parse(tq.question.solutionSteps) : undefined,
          syllabusReference: tq.question.syllabusReference || '',
          difficulty: 'ExamRealistic' as const,
          createdAt: tq.question.createdAt,
        }));

        // Build mock test object for PDF generation
        const mockTest: MockTest = {
          testId: test.id,
          configuration: {
            subject: test.subject,
            topics: topics,
            questionCount: questions.length,
            testCount: 1,
            testMode: test.mode as 'InAppExam' | 'PDFDownload',
          },
          questions,
          answerKey: new Map(questions.map(q => [q.questionId, q.correctAnswer])),
          createdAt: test.createdAt,
        };

        // Regenerate answer key PDF (no student header for answer key)
        const pdfResult = await generateAnswerKey(mockTest, topics);

        if (!pdfResult.ok) {
          return reply.status(500).send({
            error: 'PDF generation failed',
            message: pdfResult.error.reason,
          });
        }

        reply.header('Content-Type', 'application/pdf');
        reply.header('Content-Disposition', `attachment; filename="test-${testId}-answers.pdf"`);
        return reply.send(pdfResult.value.buffer);
      }

      // No student metadata - return stored PDF
      if (!test.answerKeyPDF) {
        return reply.status(404).send({
          error: 'PDF not found',
          message: 'Answer key PDF not available for this test',
        });
      }

      // Set headers for PDF download
      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', `attachment; filename="test-${testId}-answers.pdf"`);

      return reply.send(test.answerKeyPDF);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Retry test (generate similar test)
  fastify.post('/api/tests/:testId/retry', async (
    request: FastifyRequest<{ 
      Params: { testId: string };
      Body: { userId: string };
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { testId } = request.params;
      const { userId } = request.body;

      if (!userId) {
        return reply.status(400).send({
          error: 'Invalid request',
          message: 'userId is required',
        });
      }

      // Get original test configuration
      const originalTest = await prisma.test.findUnique({
        where: { id: testId },
      });

      if (!originalTest) {
        return reply.status(404).send({
          error: 'Test not found',
          message: `Test with ID ${testId} not found`,
        });
      }

      // Create new test with same configuration
      const config = {
        subject: originalTest.subject,
        topics: JSON.parse(originalTest.topics),
        questionCount: await prisma.testQuestion.count({ where: { testId } }),
        testCount: 1,
        testMode: originalTest.mode as 'InAppExam' | 'PDFDownload',
      };

      const result = await testGenerator.generateTests(config, userId);

      if (!result.ok) {
        return reply.status(400).send({
          error: 'Failed to generate retry test',
          message: result.error.type,
          details: result.error,
        });
      }

      const newTest = result.value[0];

      return reply.send({
        success: true,
        testId: newTest.testId,
        message: 'Retry test generated successfully',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
