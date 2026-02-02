// Test API routes

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/db';
import { TestGeneratorService } from '../services/testGenerator';
import { TestExecutionService } from '../services/testExecution';
import { EvaluatorService } from '../services/evaluator';
import { FeedbackEngine } from '../services/feedbackEngine';
import { PerformanceHistoryService } from '../services/performanceHistory';
import { RAGRetrieverImpl } from '../services/ragRetriever';
import { LLMQuestionGeneratorService } from '../services/llmQuestionGenerator';
import { generatePDF } from '../services/pdfGenerator';
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

      // Submit test
      const submitResult = await testExecution.submitTest(sessionId);

      if (!submitResult.ok) {
        return reply.status(400).send({
          error: 'Failed to submit test',
          message: submitResult.error.reason,
        });
      }

      const submission = submitResult.value;

      // Evaluate test
      const evalResult = await evaluator.evaluateTest(submission);

      if (!evalResult.ok) {
        return reply.status(500).send({
          error: 'Failed to evaluate test',
          message: evalResult.error.reason,
        });
      }

      const evaluation = evalResult.value;

      // Generate performance report
      const report = await feedbackEngine.generatePerformanceReport(evaluation, submission.testId);

      return reply.send({
        success: true,
        testId: submission.testId,
        submittedAt: submission.submittedAt,
        evaluation: {
          evaluationId: evaluation.evaluationId,
          overallScore: evaluation.overallScore,
          correctCount: evaluation.correctCount,
          totalCount: evaluation.totalCount,
          topicScores: evaluation.topicScores,
        },
        report: {
          reportId: report.reportId,
          weakTopics: report.weakTopics,
          suggestions: report.suggestions,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
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
      const reportResult = await performanceHistory.getPerformanceReport(testId);

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
          correctAnswer: tq.question.correctAnswer,
          syllabusReference: tq.question.syllabusReference,
          difficulty: 'ExamRealistic' as const,
          createdAt: tq.question.createdAt,
        })),
        answerKey: new Map(
          test.testQuestions.map(tq => [tq.question.id, tq.question.correctAnswer])
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
  // Requirement 3.5: Serve question paper PDF
  fastify.get('/api/tests/:testId/download/questions', async (
    request: FastifyRequest<{ Params: { testId: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { testId } = request.params;

      // Get test from database
      const test = await prisma.test.findUnique({
        where: { id: testId },
        select: {
          id: true,
          userId: true,
          questionPaperPDF: true,
        },
      });

      if (!test) {
        return reply.status(404).send({
          error: 'Test not found',
          message: `Test with ID ${testId} not found`,
        });
      }

      // Check if PDF exists
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
  // Requirement 3.6: Serve answer key PDF
  fastify.get('/api/tests/:testId/download/answers', async (
    request: FastifyRequest<{ Params: { testId: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { testId } = request.params;

      // Get test from database
      const test = await prisma.test.findUnique({
        where: { id: testId },
        select: {
          id: true,
          userId: true,
          answerKeyPDF: true,
        },
      });

      if (!test) {
        return reply.status(404).send({
          error: 'Test not found',
          message: `Test with ID ${testId} not found`,
        });
      }

      // Check if PDF exists
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
