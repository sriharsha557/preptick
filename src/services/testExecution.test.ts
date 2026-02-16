// Unit tests for Test Execution Service

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../lib/db';
import { TestExecutionService } from './testExecution';
import { TestId, UserId, SessionId, QuestionId } from '../types';

const testExecutionService = new TestExecutionService(prisma);

describe('TestExecutionService', () => {
  let testUserId: UserId;
  let testId: TestId;
  let questionIds: QuestionId[];
  let topicId: string;

  beforeEach(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'hashed_password',
        curriculum: 'CBSE',
        grade: 5,
        subjects: JSON.stringify(['Mathematics']),
      },
    });
    testUserId = user.id;

    // Create test topic
    const topic = await prisma.syllabusTopic.create({
      data: {
        curriculum: 'CBSE',
        grade: 5,
        subject: 'Mathematics',
        topicName: 'Algebra',
        syllabusSection: 'Section 1',
        officialContent: 'Basic algebra concepts',
      },
    });
    topicId = topic.id;

    // Create test questions
    const question1 = await prisma.question.create({
      data: {
        topicId,
        questionText: 'What is 2 + 2?',
        questionType: 'MultipleChoice',
        options: JSON.stringify(['3', '4', '5', '6']),
        correctAnswers: JSON.stringify(['4']),
        syllabusReference: 'Section 1.1',
      },
    });

    const question2 = await prisma.question.create({
      data: {
        topicId,
        questionText: 'What is 5 * 3?',
        questionType: 'Numerical',
        correctAnswers: JSON.stringify(['15']),
        syllabusReference: 'Section 1.2',
      },
    });

    const question3 = await prisma.question.create({
      data: {
        topicId,
        questionText: 'Solve for x: x + 5 = 10',
        questionType: 'ShortAnswer',
        correctAnswers: JSON.stringify(['5']),
        syllabusReference: 'Section 1.3',
      },
    });

    questionIds = [question1.id, question2.id, question3.id];

    // Create test
    const test = await prisma.test.create({
      data: {
        userId: testUserId,
        subject: 'Mathematics',
        topics: JSON.stringify([topicId]),
        mode: 'InAppExam',
        status: 'Generated',
      },
    });
    testId = test.id;

    // Create test questions
    await prisma.testQuestion.createMany({
      data: questionIds.map((qId, index) => ({
        testId: test.id,
        questionId: qId,
        order: index,
      })),
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.userResponse.deleteMany({
      where: { session: { userId: testUserId } },
    });
    await prisma.testSession.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.testQuestion.deleteMany({
      where: { testId },
    });
    await prisma.test.deleteMany({
      where: { id: testId },
    });
    await prisma.question.deleteMany({
      where: { id: { in: questionIds } },
    });
    await prisma.syllabusTopic.deleteMany({
      where: { id: topicId },
    });
    await prisma.user.deleteMany({
      where: { id: testUserId },
    });
  });

  describe('startTest', () => {
    it('should create a new test session successfully', async () => {
      const result = await testExecutionService.startTest(testId, testUserId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.testId).toBe(testId);
        expect(result.value.userId).toBe(testUserId);
        expect(result.value.status).toBe('InProgress');
        expect(result.value.responses.size).toBe(0);
        expect(result.value.startedAt).toBeInstanceOf(Date);
      }
    });

    it('should return existing session if one is already in progress', async () => {
      // Start first session
      const result1 = await testExecutionService.startTest(testId, testUserId);
      expect(result1.ok).toBe(true);

      if (result1.ok) {
        const sessionId1 = result1.value.sessionId;

        // Submit an answer
        await testExecutionService.submitAnswer(
          sessionId1,
          questionIds[0],
          '4'
        );

        // Try to start again
        const result2 = await testExecutionService.startTest(testId, testUserId);
        expect(result2.ok).toBe(true);

        if (result2.ok) {
          // Should return same session
          expect(result2.value.sessionId).toBe(sessionId1);
          // Should have the previously submitted answer
          expect(result2.value.responses.size).toBe(1);
        }
      }
    });

    it('should fail if test does not exist', async () => {
      const result = await testExecutionService.startTest(
        'non-existent-test-id',
        testUserId
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('StartFailed');
        expect(result.error.reason).toContain('not found');
      }
    });

    it('should fail if test mode is not InAppExam', async () => {
      // Create a PDF test
      const pdfTest = await prisma.test.create({
        data: {
          userId: testUserId,
          subject: 'Mathematics',
          topics: JSON.stringify([topicId]),
          mode: 'PrintablePDF',
          status: 'Generated',
        },
      });

      const result = await testExecutionService.startTest(pdfTest.id, testUserId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('StartFailed');
        expect(result.error.reason).toContain('expected InAppExam');
      }

      // Cleanup
      await prisma.test.delete({ where: { id: pdfTest.id } });
    });

    it('should update test status from Generated to InProgress', async () => {
      const result = await testExecutionService.startTest(testId, testUserId);
      expect(result.ok).toBe(true);

      const test = await prisma.test.findUnique({ where: { id: testId } });
      expect(test?.status).toBe('InProgress');
    });
  });

  describe('getTestSession', () => {
    it('should retrieve session with questions', async () => {
      const startResult = await testExecutionService.startTest(testId, testUserId);
      expect(startResult.ok).toBe(true);

      if (startResult.ok) {
        const sessionId = startResult.value.sessionId;
        const result = await testExecutionService.getTestSession(sessionId);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.sessionId).toBe(sessionId);
          expect(result.value.questions).toHaveLength(3);
          expect(result.value.questions[0].questionText).toBe('What is 2 + 2?');
          expect(result.value.questions[0].questionType).toBe('MultipleChoice');
          expect(result.value.questions[0].options).toEqual(['3', '4', '5', '6']);
        }
      }
    });

    it('should fail if session does not exist', async () => {
      const result = await testExecutionService.getTestSession('non-existent-session');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('StartFailed');
        expect(result.error.reason).toContain('not found');
      }
    });

    it('should include submitted responses in session', async () => {
      const startResult = await testExecutionService.startTest(testId, testUserId);
      expect(startResult.ok).toBe(true);

      if (startResult.ok) {
        const sessionId = startResult.value.sessionId;

        // Submit answers
        await testExecutionService.submitAnswer(sessionId, questionIds[0], '4');
        await testExecutionService.submitAnswer(sessionId, questionIds[1], '15');

        const result = await testExecutionService.getTestSession(sessionId);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.responses.size).toBe(2);
          expect(result.value.responses.get(questionIds[0])?.answer).toBe('4');
          expect(result.value.responses.get(questionIds[1])?.answer).toBe('15');
        }
      }
    });
  });

  describe('submitAnswer', () => {
    let sessionId: SessionId;

    beforeEach(async () => {
      const result = await testExecutionService.startTest(testId, testUserId);
      if (result.ok) {
        sessionId = result.value.sessionId;
      }
    });

    it('should save answer with timestamp', async () => {
      const result = await testExecutionService.submitAnswer(
        sessionId,
        questionIds[0],
        '4'
      );

      expect(result.ok).toBe(true);

      // Verify answer was saved
      const response = await prisma.userResponse.findUnique({
        where: {
          sessionId_questionId: {
            sessionId,
            questionId: questionIds[0],
          },
        },
      });

      expect(response).not.toBeNull();
      expect(response?.userAnswer).toBe('4');
      expect(response?.answeredAt).toBeInstanceOf(Date);
    });

    it('should allow updating an answer (navigation)', async () => {
      // Submit first answer
      await testExecutionService.submitAnswer(sessionId, questionIds[0], '3');

      // Update answer
      const result = await testExecutionService.submitAnswer(
        sessionId,
        questionIds[0],
        '4'
      );

      expect(result.ok).toBe(true);

      // Verify answer was updated
      const response = await prisma.userResponse.findUnique({
        where: {
          sessionId_questionId: {
            sessionId,
            questionId: questionIds[0],
          },
        },
      });

      expect(response?.userAnswer).toBe('4');
    });

    it('should fail if session does not exist', async () => {
      const result = await testExecutionService.submitAnswer(
        'non-existent-session',
        questionIds[0],
        '4'
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('SubmitFailed');
        expect(result.error.reason).toContain('not found');
      }
    });

    it('should fail if question does not belong to test', async () => {
      const result = await testExecutionService.submitAnswer(
        sessionId,
        'non-existent-question',
        '4'
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('SubmitFailed');
        expect(result.error.reason).toContain('does not belong to test');
      }
    });

    it('should fail if session is already submitted', async () => {
      // Submit test
      await testExecutionService.submitTest(sessionId);

      // Try to submit answer
      const result = await testExecutionService.submitAnswer(
        sessionId,
        questionIds[0],
        '4'
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('SubmitFailed');
        expect(result.error.reason).toContain('completed test session');
      }
    });
  });

  describe('submitTest', () => {
    let sessionId: SessionId;

    beforeEach(async () => {
      const result = await testExecutionService.startTest(testId, testUserId);
      if (result.ok) {
        sessionId = result.value.sessionId;
      }
    });

    it('should submit test successfully', async () => {
      // Submit some answers
      await testExecutionService.submitAnswer(sessionId, questionIds[0], '4');
      await testExecutionService.submitAnswer(sessionId, questionIds[1], '15');

      const result = await testExecutionService.submitTest(sessionId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.sessionId).toBe(sessionId);
        expect(result.value.testId).toBe(testId);
        expect(result.value.responses.size).toBe(2);
        expect(result.value.submittedAt).toBeInstanceOf(Date);
      }
    });

    it('should update session status to Submitted', async () => {
      const result = await testExecutionService.submitTest(sessionId);
      expect(result.ok).toBe(true);

      const session = await prisma.testSession.findUnique({
        where: { id: sessionId },
      });

      expect(session?.status).toBe('Submitted');
      expect(session?.submittedAt).toBeInstanceOf(Date);
    });

    it('should update test status to Submitted', async () => {
      const result = await testExecutionService.submitTest(sessionId);
      expect(result.ok).toBe(true);

      const test = await prisma.test.findUnique({
        where: { id: testId },
      });

      expect(test?.status).toBe('Submitted');
    });

    it('should fail if session does not exist', async () => {
      const result = await testExecutionService.submitTest('non-existent-session');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('SubmitFailed');
        expect(result.error.reason).toContain('not found');
      }
    });

    it('should fail if test is already submitted', async () => {
      // Submit once
      await testExecutionService.submitTest(sessionId);

      // Try to submit again
      const result = await testExecutionService.submitTest(sessionId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('SubmitFailed');
        expect(result.error.reason).toContain('already been submitted');
      }
    });

    it('should prevent answer modification after submission', async () => {
      // Submit test
      await testExecutionService.submitTest(sessionId);

      // Try to submit answer
      const result = await testExecutionService.submitAnswer(
        sessionId,
        questionIds[0],
        '4'
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.reason).toContain('completed test session');
      }
    });
  });

  describe('getAnswerKey', () => {
    let sessionId: SessionId;

    beforeEach(async () => {
      const result = await testExecutionService.startTest(testId, testUserId);
      if (result.ok) {
        sessionId = result.value.sessionId;
      }
    });

    it('should deny access to answer key during active test', async () => {
      const result = await testExecutionService.getAnswerKey(testId, testUserId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('SubmitFailed');
        expect(result.error.reason).toContain('only accessible after test submission');
      }
    });

    it('should provide answer key after test submission', async () => {
      // Submit test
      await testExecutionService.submitTest(sessionId);

      const result = await testExecutionService.getAnswerKey(testId, testUserId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.size).toBe(3);
        expect(result.value.get(questionIds[0])).toBe('4');
        expect(result.value.get(questionIds[1])).toBe('15');
        expect(result.value.get(questionIds[2])).toBe('5');
      }
    });

    it('should fail if no session exists for user and test', async () => {
      const result = await testExecutionService.getAnswerKey(testId, 'other-user');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('SubmitFailed');
        expect(result.error.reason).toContain('No test session found');
      }
    });
  });

  describe('getAnswerComparison', () => {
    let sessionId: SessionId;

    beforeEach(async () => {
      const result = await testExecutionService.startTest(testId, testUserId);
      if (result.ok) {
        sessionId = result.value.sessionId;
      }
    });

    it('should deny access during active test', async () => {
      const result = await testExecutionService.getAnswerComparison(testId, testUserId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('SubmitFailed');
        expect(result.error.reason).toContain('only available after test submission');
      }
    });

    it('should show correct and incorrect answers after submission', async () => {
      // Submit answers (one correct, one incorrect, one unanswered)
      await testExecutionService.submitAnswer(sessionId, questionIds[0], '4'); // Correct
      await testExecutionService.submitAnswer(sessionId, questionIds[1], '10'); // Incorrect

      // Submit test
      await testExecutionService.submitTest(sessionId);

      const result = await testExecutionService.getAnswerComparison(testId, testUserId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(3);

        // Check first question (correct)
        expect(result.value[0].questionId).toBe(questionIds[0]);
        expect(result.value[0].userAnswer).toBe('4');
        expect(result.value[0].correctAnswer).toBe('4');
        expect(result.value[0].isCorrect).toBe(true);

        // Check second question (incorrect)
        expect(result.value[1].questionId).toBe(questionIds[1]);
        expect(result.value[1].userAnswer).toBe('10');
        expect(result.value[1].correctAnswer).toBe('15');
        expect(result.value[1].isCorrect).toBe(false);

        // Check third question (unanswered)
        expect(result.value[2].questionId).toBe(questionIds[2]);
        expect(result.value[2].userAnswer).toBeNull();
        expect(result.value[2].correctAnswer).toBe('5');
        expect(result.value[2].isCorrect).toBe(false);
      }
    });

    it('should handle case-insensitive and whitespace-tolerant matching', async () => {
      // Submit answer with different case and whitespace
      await testExecutionService.submitAnswer(sessionId, questionIds[2], '  5  ');

      // Submit test
      await testExecutionService.submitTest(sessionId);

      const result = await testExecutionService.getAnswerComparison(testId, testUserId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const question3Result = result.value.find(r => r.questionId === questionIds[2]);
        expect(question3Result?.isCorrect).toBe(true);
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle test with no questions', async () => {
      // Create test with no questions
      const emptyTest = await prisma.test.create({
        data: {
          userId: testUserId,
          subject: 'Mathematics',
          topics: JSON.stringify([topicId]),
          mode: 'InAppExam',
          status: 'Generated',
        },
      });

      const startResult = await testExecutionService.startTest(emptyTest.id, testUserId);
      expect(startResult.ok).toBe(true);

      if (startResult.ok) {
        const sessionResult = await testExecutionService.getTestSession(startResult.value.sessionId);
        expect(sessionResult.ok).toBe(true);
        if (sessionResult.ok) {
          expect(sessionResult.value.questions).toHaveLength(0);
        }

        // Should be able to submit empty test
        const submitResult = await testExecutionService.submitTest(startResult.value.sessionId);
        expect(submitResult.ok).toBe(true);
      }

      // Cleanup
      await prisma.testSession.deleteMany({ where: { testId: emptyTest.id } });
      await prisma.test.delete({ where: { id: emptyTest.id } });
    });

    it('should handle multiple users taking the same test', async () => {
      // Create second user
      const user2 = await prisma.user.create({
        data: {
          email: `test2-${Date.now()}@example.com`,
          passwordHash: 'hashed_password',
          curriculum: 'CBSE',
          grade: 5,
          subjects: JSON.stringify(['Mathematics']),
        },
      });

      // Create a shared test (using first user as owner)
      const sharedTest = await prisma.test.create({
        data: {
          userId: testUserId,
          subject: 'Mathematics',
          topics: JSON.stringify([topicId]),
          mode: 'InAppExam',
          status: 'Generated',
        },
      });

      await prisma.testQuestion.createMany({
        data: questionIds.map((qId, index) => ({
          testId: sharedTest.id,
          questionId: qId,
          order: index,
        })),
      });

      // Both users start the test
      const result1 = await testExecutionService.startTest(sharedTest.id, testUserId);
      const result2 = await testExecutionService.startTest(sharedTest.id, user2.id);

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);

      if (result1.ok && result2.ok) {
        // Sessions should be different
        expect(result1.value.sessionId).not.toBe(result2.value.sessionId);

        // Each user submits different answers
        await testExecutionService.submitAnswer(result1.value.sessionId, questionIds[0], '4');
        await testExecutionService.submitAnswer(result2.value.sessionId, questionIds[0], '3');

        // Verify answers are separate
        const session1 = await testExecutionService.getTestSession(result1.value.sessionId);
        const session2 = await testExecutionService.getTestSession(result2.value.sessionId);

        if (session1.ok && session2.ok) {
          expect(session1.value.responses.get(questionIds[0])?.answer).toBe('4');
          expect(session2.value.responses.get(questionIds[0])?.answer).toBe('3');
        }
      }

      // Cleanup
      await prisma.userResponse.deleteMany({
        where: { session: { testId: sharedTest.id } },
      });
      await prisma.testSession.deleteMany({ where: { testId: sharedTest.id } });
      await prisma.testQuestion.deleteMany({ where: { testId: sharedTest.id } });
      await prisma.test.delete({ where: { id: sharedTest.id } });
      await prisma.user.delete({ where: { id: user2.id } });
    });
  });
});
