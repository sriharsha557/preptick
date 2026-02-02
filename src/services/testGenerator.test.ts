// Test Generator Service tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestGeneratorService } from './testGenerator';
import { TestConfiguration, Question, Ok, Err } from '../types';

describe('TestGeneratorService - Configuration Validation', () => {
  // Create a mock Prisma client
  const createMockPrisma = (topicIds: string[] = [], questionCount: number = 0) => ({
    syllabusTopic: {
      findMany: vi.fn().mockResolvedValue(
        topicIds.map(id => ({ id }))
      ),
    },
    question: {
      count: vi.fn().mockResolvedValue(questionCount),
    },
    test: {
      create: vi.fn().mockResolvedValue({ id: 'test-id' }),
    },
    testQuestion: {
      create: vi.fn().mockResolvedValue({ id: 'test-question-id' }),
    },
  } as any);

  // Create a mock RAG retriever
  const mockRagRetriever = {
    retrieveQuestions: vi.fn(),
    indexQuestion: vi.fn(),
    getSyllabusContext: vi.fn(),
  } as any;

  describe('validateConfiguration', () => {
    it('should reject negative question count', async () => {
      const prisma = createMockPrisma();
      const testGenerator = new TestGeneratorService(prisma, mockRagRetriever);

      const config: TestConfiguration = {
        subject: 'Mathematics',
        topics: ['topic1'],
        questionCount: -5,
        testCount: 1,
        testMode: 'InAppExam',
      };

      const result = await testGenerator.validateConfiguration(config);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('InvalidQuestionCount');
      }
    });

    it('should reject zero question count', async () => {
      const prisma = createMockPrisma();
      const testGenerator = new TestGeneratorService(prisma, mockRagRetriever);

      const config: TestConfiguration = {
        subject: 'Mathematics',
        topics: ['topic1'],
        questionCount: 0,
        testCount: 1,
        testMode: 'InAppExam',
      };

      const result = await testGenerator.validateConfiguration(config);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('InvalidQuestionCount');
      }
    });

    it('should reject non-integer question count', async () => {
      const prisma = createMockPrisma();
      const testGenerator = new TestGeneratorService(prisma, mockRagRetriever);

      const config: TestConfiguration = {
        subject: 'Mathematics',
        topics: ['topic1'],
        questionCount: 5.5,
        testCount: 1,
        testMode: 'InAppExam',
      };

      const result = await testGenerator.validateConfiguration(config);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('InvalidQuestionCount');
      }
    });

    it('should reject negative test count', async () => {
      const prisma = createMockPrisma();
      const testGenerator = new TestGeneratorService(prisma, mockRagRetriever);

      const config: TestConfiguration = {
        subject: 'Mathematics',
        topics: ['topic1'],
        questionCount: 10,
        testCount: -2,
        testMode: 'InAppExam',
      };

      const result = await testGenerator.validateConfiguration(config);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('InvalidTestCount');
      }
    });

    it('should reject zero test count', async () => {
      const prisma = createMockPrisma();
      const testGenerator = new TestGeneratorService(prisma, mockRagRetriever);

      const config: TestConfiguration = {
        subject: 'Mathematics',
        topics: ['topic1'],
        questionCount: 10,
        testCount: 0,
        testMode: 'InAppExam',
      };

      const result = await testGenerator.validateConfiguration(config);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('InvalidTestCount');
      }
    });

    it('should reject empty topic list', async () => {
      const prisma = createMockPrisma();
      const testGenerator = new TestGeneratorService(prisma, mockRagRetriever);

      const config: TestConfiguration = {
        subject: 'Mathematics',
        topics: [],
        questionCount: 10,
        testCount: 1,
        testMode: 'InAppExam',
      };

      const result = await testGenerator.validateConfiguration(config);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('NoTopicsSelected');
      }
    });

    it('should reject non-existent topics', async () => {
      const prisma = createMockPrisma([], 0); // No topics exist
      const testGenerator = new TestGeneratorService(prisma, mockRagRetriever);

      const config: TestConfiguration = {
        subject: 'Mathematics',
        topics: ['nonexistent-topic'],
        questionCount: 10,
        testCount: 1,
        testMode: 'InAppExam',
      };

      const result = await testGenerator.validateConfiguration(config);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('InvalidTopics');
      }
    });

    it('should reject when insufficient questions available', async () => {
      const prisma = createMockPrisma(['topic1'], 5); // Only 5 questions available
      const testGenerator = new TestGeneratorService(prisma, mockRagRetriever);

      const config: TestConfiguration = {
        subject: 'Mathematics',
        topics: ['topic1'],
        questionCount: 10, // Need 10 but only 5 available
        testCount: 1,
        testMode: 'InAppExam',
      };

      const result = await testGenerator.validateConfiguration(config);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('InsufficientQuestions');
        expect(result.error.available).toBe(5);
        expect(result.error.requested).toBe(10);
      }
    });

    it('should provide actionable suggestions when insufficient questions available', async () => {
      const prisma = createMockPrisma(['topic1'], 15); // Only 15 questions available
      const testGenerator = new TestGeneratorService(prisma, mockRagRetriever);

      const config: TestConfiguration = {
        subject: 'Mathematics',
        topics: ['topic1'],
        questionCount: 10,
        testCount: 3, // Need 30 but only 15 available
        testMode: 'InAppExam',
      };

      const result = await testGenerator.validateConfiguration(config);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('InsufficientQuestions');
        expect(result.error.available).toBe(15);
        expect(result.error.requested).toBe(30);
        
        // Check that error message includes actionable suggestions
        expect(result.error.message).toContain('Available: 15 questions');
        expect(result.error.message).toContain('Requested: 30 questions');
        expect(result.error.message).toContain('15 short');
        expect(result.error.message).toContain('Suggested actions:');
        expect(result.error.message).toContain('Reduce the number of questions per test');
        expect(result.error.message).toContain('Reduce the number of tests');
        expect(result.error.message).toContain('Select additional topics');
      }
    });

    it('should suggest reducing questions per test when multiple tests requested', async () => {
      const prisma = createMockPrisma(['topic1'], 20); // 20 questions available
      const testGenerator = new TestGeneratorService(prisma, mockRagRetriever);

      const config: TestConfiguration = {
        subject: 'Mathematics',
        topics: ['topic1'],
        questionCount: 15,
        testCount: 2, // Need 30 but only 20 available
        testMode: 'InAppExam',
      };

      const result = await testGenerator.validateConfiguration(config);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('InsufficientQuestions');
        // With 20 available and 2 tests, max questions per test = 20/2 = 10
        expect(result.error.message).toContain('Reduce the number of questions per test to 10 or fewer');
      }
    });

    it('should suggest reducing number of tests when many tests requested', async () => {
      const prisma = createMockPrisma(['topic1'], 25); // 25 questions available
      const testGenerator = new TestGeneratorService(prisma, mockRagRetriever);

      const config: TestConfiguration = {
        subject: 'Mathematics',
        topics: ['topic1'],
        questionCount: 10,
        testCount: 5, // Need 50 but only 25 available
        testMode: 'InAppExam',
      };

      const result = await testGenerator.validateConfiguration(config);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('InsufficientQuestions');
        expect(result.error.message).toContain('Reduce the number of tests to 2 or fewer');
      }
    });

    it('should provide special message when no questions available', async () => {
      const prisma = createMockPrisma(['topic1'], 0); // No questions available
      const testGenerator = new TestGeneratorService(prisma, mockRagRetriever);

      const config: TestConfiguration = {
        subject: 'Mathematics',
        topics: ['topic1'],
        questionCount: 10,
        testCount: 1,
        testMode: 'InAppExam',
      };

      const result = await testGenerator.validateConfiguration(config);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('InsufficientQuestions');
        expect(result.error.available).toBe(0);
        expect(result.error.message).toContain('No questions available for the selected topics');
        expect(result.error.message).toContain('select different topics or contact support');
      }
    });

    it('should always suggest selecting additional topics', async () => {
      const prisma = createMockPrisma(['topic1'], 8); // 8 questions available
      const testGenerator = new TestGeneratorService(prisma, mockRagRetriever);

      const config: TestConfiguration = {
        subject: 'Mathematics',
        topics: ['topic1'],
        questionCount: 5,
        testCount: 2, // Need 10 but only 8 available
        testMode: 'InAppExam',
      };

      const result = await testGenerator.validateConfiguration(config);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('InsufficientQuestions');
        expect(result.error.message).toContain('Select additional topics to expand the question pool');
      }
    });

    it('should accept valid configuration', async () => {
      const prisma = createMockPrisma(['topic1'], 20); // 20 questions available
      const testGenerator = new TestGeneratorService(prisma, mockRagRetriever);

      const config: TestConfiguration = {
        subject: 'Mathematics',
        topics: ['topic1'],
        questionCount: 10,
        testCount: 1,
        testMode: 'InAppExam',
      };

      const result = await testGenerator.validateConfiguration(config);

      expect(result.ok).toBe(true);
    });
  });
});


describe('TestGeneratorService - Test Generation Orchestration', () => {
  let mockPrisma: any;
  let mockRagRetriever: any;
  let testGenerator: TestGeneratorService;

  beforeEach(() => {
    // Reset mocks before each test
    mockPrisma = {
      syllabusTopic: {
        findMany: vi.fn(),
      },
      question: {
        count: vi.fn(),
      },
      test: {
        create: vi.fn(),
      },
      testQuestion: {
        create: vi.fn(),
      },
    };

    mockRagRetriever = {
      retrieveQuestions: vi.fn(),
      indexQuestion: vi.fn(),
      getSyllabusContext: vi.fn(),
    };

    testGenerator = new TestGeneratorService(mockPrisma, mockRagRetriever);
  });

  describe('generateTests - RAG Integration (Requirement 4.1)', () => {
    it('should call RAG retriever to retrieve syllabus-aligned content', async () => {
      // Setup
      const config: TestConfiguration = {
        subject: 'Mathematics',
        topics: ['topic1'],
        questionCount: 5,
        testCount: 1,
        testMode: 'InAppExam',
      };

      const mockQuestions: Question[] = [
        {
          questionId: 'q1',
          topicId: 'topic1',
          questionText: 'What is 2+2?',
          questionType: 'MultipleChoice',
          options: ['3', '4', '5', '6'],
          correctAnswer: '4',
          syllabusReference: 'Section 1.1',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
        {
          questionId: 'q2',
          topicId: 'topic1',
          questionText: 'What is 3+3?',
          questionType: 'MultipleChoice',
          options: ['5', '6', '7', '8'],
          correctAnswer: '6',
          syllabusReference: 'Section 1.1',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
        {
          questionId: 'q3',
          topicId: 'topic1',
          questionText: 'What is 4+4?',
          questionType: 'MultipleChoice',
          options: ['6', '7', '8', '9'],
          correctAnswer: '8',
          syllabusReference: 'Section 1.1',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
        {
          questionId: 'q4',
          topicId: 'topic1',
          questionText: 'What is 5+5?',
          questionType: 'MultipleChoice',
          options: ['8', '9', '10', '11'],
          correctAnswer: '10',
          syllabusReference: 'Section 1.1',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
        {
          questionId: 'q5',
          topicId: 'topic1',
          questionText: 'What is 6+6?',
          questionType: 'MultipleChoice',
          options: ['10', '11', '12', '13'],
          correctAnswer: '12',
          syllabusReference: 'Section 1.1',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
      ];

      mockPrisma.syllabusTopic.findMany.mockResolvedValue([{ id: 'topic1' }]);
      mockPrisma.question.count.mockResolvedValue(10);
      mockRagRetriever.retrieveQuestions.mockResolvedValue(Ok(mockQuestions));
      mockPrisma.test.create.mockResolvedValue({ id: 'test-1' });
      mockPrisma.testQuestion.create.mockResolvedValue({ id: 'tq-1' });

      // Execute
      const result = await testGenerator.generateTests(config, 'user-123');

      // Verify RAG retriever was called
      expect(mockRagRetriever.retrieveQuestions).toHaveBeenCalledWith(
        ['topic1'],
        5,
        []
      );
      expect(result.ok).toBe(true);
    });
  });

  describe('generateTests - Topic Matching (Requirement 4.2)', () => {
    it('should ensure all questions match selected topics from official syllabus', async () => {
      const config: TestConfiguration = {
        subject: 'Mathematics',
        topics: ['topic1', 'topic2'],
        questionCount: 3,
        testCount: 1,
        testMode: 'InAppExam',
      };

      const mockQuestions: Question[] = [
        {
          questionId: 'q1',
          topicId: 'topic1',
          questionText: 'Question 1',
          questionType: 'MultipleChoice',
          correctAnswer: 'A',
          syllabusReference: 'Section 1.1',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
        {
          questionId: 'q2',
          topicId: 'topic2',
          questionText: 'Question 2',
          questionType: 'MultipleChoice',
          correctAnswer: 'B',
          syllabusReference: 'Section 1.2',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
        {
          questionId: 'q3',
          topicId: 'topic1',
          questionText: 'Question 3',
          questionType: 'MultipleChoice',
          correctAnswer: 'C',
          syllabusReference: 'Section 1.1',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
      ];

      mockPrisma.syllabusTopic.findMany.mockResolvedValue([
        { id: 'topic1' },
        { id: 'topic2' },
      ]);
      mockPrisma.question.count.mockResolvedValue(10);
      mockRagRetriever.retrieveQuestions.mockResolvedValue(Ok(mockQuestions));
      mockPrisma.test.create.mockResolvedValue({ id: 'test-1' });
      mockPrisma.testQuestion.create.mockResolvedValue({ id: 'tq-1' });

      const result = await testGenerator.generateTests(config, 'user-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const test = result.value[0];
        // Verify all questions belong to selected topics
        test.questions.forEach(q => {
          expect(['topic1', 'topic2']).toContain(q.topicId);
        });
      }
    });

    it('should reject questions that do not match selected topics', async () => {
      const config: TestConfiguration = {
        subject: 'Mathematics',
        topics: ['topic1'],
        questionCount: 2,
        testCount: 1,
        testMode: 'InAppExam',
      };

      const mockQuestions: Question[] = [
        {
          questionId: 'q1',
          topicId: 'topic1',
          questionText: 'Question 1',
          questionType: 'MultipleChoice',
          correctAnswer: 'A',
          syllabusReference: 'Section 1.1',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
        {
          questionId: 'q2',
          topicId: 'topic-wrong', // Wrong topic!
          questionText: 'Question 2',
          questionType: 'MultipleChoice',
          correctAnswer: 'B',
          syllabusReference: 'Section 1.2',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
      ];

      mockPrisma.syllabusTopic.findMany.mockResolvedValue([{ id: 'topic1' }]);
      mockPrisma.question.count.mockResolvedValue(10);
      mockRagRetriever.retrieveQuestions.mockResolvedValue(Ok(mockQuestions));

      const result = await testGenerator.generateTests(config, 'user-123');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('GenerationFailed');
        expect(result.error.message).toContain('topic mismatch');
      }
    });
  });

  describe('generateTests - Exam-Realistic Difficulty (Requirement 4.3)', () => {
    it('should ensure all questions have exam-realistic difficulty', async () => {
      const config: TestConfiguration = {
        subject: 'Mathematics',
        topics: ['topic1'],
        questionCount: 3,
        testCount: 1,
        testMode: 'InAppExam',
      };

      const mockQuestions: Question[] = [
        {
          questionId: 'q1',
          topicId: 'topic1',
          questionText: 'Question 1',
          questionType: 'MultipleChoice',
          correctAnswer: 'A',
          syllabusReference: 'Section 1.1',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
        {
          questionId: 'q2',
          topicId: 'topic1',
          questionText: 'Question 2',
          questionType: 'MultipleChoice',
          correctAnswer: 'B',
          syllabusReference: 'Section 1.1',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
        {
          questionId: 'q3',
          topicId: 'topic1',
          questionText: 'Question 3',
          questionType: 'MultipleChoice',
          correctAnswer: 'C',
          syllabusReference: 'Section 1.1',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
      ];

      mockPrisma.syllabusTopic.findMany.mockResolvedValue([{ id: 'topic1' }]);
      mockPrisma.question.count.mockResolvedValue(10);
      mockRagRetriever.retrieveQuestions.mockResolvedValue(Ok(mockQuestions));
      mockPrisma.test.create.mockResolvedValue({ id: 'test-1' });
      mockPrisma.testQuestion.create.mockResolvedValue({ id: 'tq-1' });

      const result = await testGenerator.generateTests(config, 'user-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const test = result.value[0];
        // Verify all questions have ExamRealistic difficulty
        test.questions.forEach(q => {
          expect(q.difficulty).toBe('ExamRealistic');
        });
      }
    });
  });

  describe('generateTests - Question Uniqueness (Requirement 4.4)', () => {
    it('should ensure each test contains unique questions across multiple tests', async () => {
      const config: TestConfiguration = {
        subject: 'Mathematics',
        topics: ['topic1'],
        questionCount: 2,
        testCount: 3,
        testMode: 'InAppExam',
      };

      // Mock different questions for each call
      let callCount = 0;
      mockRagRetriever.retrieveQuestions.mockImplementation((topics, count, excludeIds) => {
        callCount++;
        const questions: Question[] = [
          {
            questionId: `q${callCount * 2 - 1}`,
            topicId: 'topic1',
            questionText: `Question ${callCount * 2 - 1}`,
            questionType: 'MultipleChoice',
            correctAnswer: 'A',
            syllabusReference: 'Section 1.1',
            difficulty: 'ExamRealistic',
            createdAt: new Date(),
          },
          {
            questionId: `q${callCount * 2}`,
            topicId: 'topic1',
            questionText: `Question ${callCount * 2}`,
            questionType: 'MultipleChoice',
            correctAnswer: 'B',
            syllabusReference: 'Section 1.1',
            difficulty: 'ExamRealistic',
            createdAt: new Date(),
          },
        ];
        return Promise.resolve(Ok(questions));
      });

      mockPrisma.syllabusTopic.findMany.mockResolvedValue([{ id: 'topic1' }]);
      mockPrisma.question.count.mockResolvedValue(10);
      mockPrisma.test.create.mockResolvedValue({ id: 'test-1' });
      mockPrisma.testQuestion.create.mockResolvedValue({ id: 'tq-1' });

      const result = await testGenerator.generateTests(config, 'user-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const tests = result.value;
        expect(tests.length).toBe(3);

        // Collect all question IDs across all tests
        const allQuestionIds = new Set<string>();
        tests.forEach(test => {
          test.questions.forEach(q => {
            // Each question ID should be unique across all tests
            expect(allQuestionIds.has(q.questionId)).toBe(false);
            allQuestionIds.add(q.questionId);
          });
        });

        // Verify RAG retriever was called with exclusion list
        expect(mockRagRetriever.retrieveQuestions).toHaveBeenCalledTimes(3);
        
        // First call should have empty exclusion list
        expect(mockRagRetriever.retrieveQuestions).toHaveBeenNthCalledWith(
          1,
          ['topic1'],
          2,
          []
        );
        
        // Second call should exclude first test's questions
        expect(mockRagRetriever.retrieveQuestions).toHaveBeenNthCalledWith(
          2,
          ['topic1'],
          2,
          ['q1', 'q2']
        );
        
        // Third call should exclude first and second test's questions
        expect(mockRagRetriever.retrieveQuestions).toHaveBeenNthCalledWith(
          3,
          ['topic1'],
          2,
          ['q1', 'q2', 'q3', 'q4']
        );
      }
    });
  });

  describe('generateTests - Answer Key Generation (Requirement 4.5)', () => {
    it('should generate answer keys with correct answers for each question', async () => {
      const config: TestConfiguration = {
        subject: 'Mathematics',
        topics: ['topic1'],
        questionCount: 3,
        testCount: 1,
        testMode: 'InAppExam',
      };

      const mockQuestions: Question[] = [
        {
          questionId: 'q1',
          topicId: 'topic1',
          questionText: 'What is 2+2?',
          questionType: 'MultipleChoice',
          options: ['3', '4', '5', '6'],
          correctAnswer: '4',
          syllabusReference: 'Section 1.1',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
        {
          questionId: 'q2',
          topicId: 'topic1',
          questionText: 'What is 3+3?',
          questionType: 'MultipleChoice',
          options: ['5', '6', '7', '8'],
          correctAnswer: '6',
          syllabusReference: 'Section 1.1',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
        {
          questionId: 'q3',
          topicId: 'topic1',
          questionText: 'What is 4+4?',
          questionType: 'MultipleChoice',
          options: ['6', '7', '8', '9'],
          correctAnswer: '8',
          syllabusReference: 'Section 1.1',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
      ];

      mockPrisma.syllabusTopic.findMany.mockResolvedValue([{ id: 'topic1' }]);
      mockPrisma.question.count.mockResolvedValue(10);
      mockRagRetriever.retrieveQuestions.mockResolvedValue(Ok(mockQuestions));
      mockPrisma.test.create.mockResolvedValue({ id: 'test-1' });
      mockPrisma.testQuestion.create.mockResolvedValue({ id: 'tq-1' });

      const result = await testGenerator.generateTests(config, 'user-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const test = result.value[0];
        
        // Verify answer key exists and has correct answers
        expect(test.answerKey).toBeDefined();
        expect(test.answerKey.size).toBe(3);
        
        // Verify each question has a correct answer in the answer key
        expect(test.answerKey.get('q1')).toBe('4');
        expect(test.answerKey.get('q2')).toBe('6');
        expect(test.answerKey.get('q3')).toBe('8');
      }
    });
  });

  describe('generateTests - Persistence', () => {
    it('should persist test configurations and generated tests', async () => {
      const config: TestConfiguration = {
        subject: 'Mathematics',
        topics: ['topic1', 'topic2'],
        questionCount: 2,
        testCount: 1,
        testMode: 'PrintablePDF',
      };

      const mockQuestions: Question[] = [
        {
          questionId: 'q1',
          topicId: 'topic1',
          questionText: 'Question 1',
          questionType: 'MultipleChoice',
          correctAnswer: 'A',
          syllabusReference: 'Section 1.1',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
        {
          questionId: 'q2',
          topicId: 'topic2',
          questionText: 'Question 2',
          questionType: 'ShortAnswer',
          correctAnswer: 'Answer 2',
          syllabusReference: 'Section 2.1',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
      ];

      mockPrisma.syllabusTopic.findMany.mockResolvedValue([
        { id: 'topic1' },
        { id: 'topic2' },
      ]);
      mockPrisma.question.count.mockResolvedValue(10);
      mockRagRetriever.retrieveQuestions.mockResolvedValue(Ok(mockQuestions));
      mockPrisma.test.create.mockResolvedValue({ id: 'test-123' });
      mockPrisma.testQuestion.create.mockResolvedValue({ id: 'tq-1' });

      const result = await testGenerator.generateTests(config, 'user-456');

      expect(result.ok).toBe(true);

      // Verify test was persisted with correct configuration
      expect(mockPrisma.test.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-456',
          subject: 'Mathematics',
          topics: JSON.stringify(['topic1', 'topic2']),
          mode: 'PrintablePDF',
          status: 'Generated',
        }),
      });

      // Verify test questions were persisted with proper ordering
      expect(mockPrisma.testQuestion.create).toHaveBeenCalledTimes(2);
      expect(mockPrisma.testQuestion.create).toHaveBeenNthCalledWith(1, {
        data: {
          testId: 'test-123',
          questionId: 'q1',
          order: 0,
        },
      });
      expect(mockPrisma.testQuestion.create).toHaveBeenNthCalledWith(2, {
        data: {
          testId: 'test-123',
          questionId: 'q2',
          order: 1,
        },
      });
    });
  });

  describe('generateTests - Error Handling', () => {
    it('should handle RAG retrieval errors', async () => {
      const config: TestConfiguration = {
        subject: 'Mathematics',
        topics: ['topic1'],
        questionCount: 5,
        testCount: 1,
        testMode: 'InAppExam',
      };

      mockPrisma.syllabusTopic.findMany.mockResolvedValue([{ id: 'topic1' }]);
      mockPrisma.question.count.mockResolvedValue(10);
      mockRagRetriever.retrieveQuestions.mockResolvedValue(
        Err({
          type: 'InsufficientMatches',
          found: 3,
          requested: 5,
        })
      );

      const result = await testGenerator.generateTests(config, 'user-123');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('RetrievalError');
      }
    });

    it('should handle configuration validation errors', async () => {
      const config: TestConfiguration = {
        subject: 'Mathematics',
        topics: ['topic1'],
        questionCount: -5, // Invalid
        testCount: 1,
        testMode: 'InAppExam',
      };

      const result = await testGenerator.generateTests(config, 'user-123');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('ConfigurationError');
      }
    });

    it('should handle insufficient questions error with actionable suggestions', async () => {
      const config: TestConfiguration = {
        subject: 'Mathematics',
        topics: ['topic1'],
        questionCount: 10,
        testCount: 3, // Need 30 questions
        testMode: 'InAppExam',
      };

      mockPrisma.syllabusTopic.findMany.mockResolvedValue([{ id: 'topic1' }]);
      mockPrisma.question.count.mockResolvedValue(20); // Only 20 available

      const result = await testGenerator.generateTests(config, 'user-123');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('ConfigurationError');
        expect(result.error.details.type).toBe('InsufficientQuestions');
        if (result.error.details.type === 'InsufficientQuestions') {
          expect(result.error.details.available).toBe(20);
          expect(result.error.details.requested).toBe(30);
          expect(result.error.details.message).toContain('Available: 20 questions');
          expect(result.error.details.message).toContain('Requested: 30 questions');
          expect(result.error.details.message).toContain('Suggested actions:');
          expect(result.error.details.message).toContain('Reduce the number of questions per test');
          expect(result.error.details.message).toContain('Reduce the number of tests to 2 or fewer');
          expect(result.error.details.message).toContain('Select additional topics');
        }
      }
    });
  });
});


describe('TestGeneratorService - LLM Fallback Integration (Task 7.3)', () => {
  let mockPrisma: any;
  let mockRagRetriever: any;
  let mockLlmGenerator: any;
  let testGenerator: TestGeneratorService;

  beforeEach(() => {
    // Reset mocks before each test
    mockPrisma = {
      syllabusTopic: {
        findMany: vi.fn(),
      },
      question: {
        count: vi.fn(),
        create: vi.fn(),
      },
      test: {
        create: vi.fn(),
      },
      testQuestion: {
        create: vi.fn(),
      },
    };

    mockRagRetriever = {
      retrieveQuestions: vi.fn(),
      indexQuestion: vi.fn(),
      getSyllabusContext: vi.fn(),
    };

    mockLlmGenerator = {
      generateQuestions: vi.fn(),
      validateSyllabusAlignment: vi.fn(),
    };

    testGenerator = new TestGeneratorService(mockPrisma, mockRagRetriever, mockLlmGenerator);
  });

  describe('LLM as fallback when RAG is insufficient (Requirement 13.4)', () => {
    it('should use LLM generator when RAG returns insufficient questions', async () => {
      const config: TestConfiguration = {
        subject: 'Mathematics',
        topics: ['topic1'],
        questionCount: 5,
        testCount: 1,
        testMode: 'InAppExam',
      };

      // RAG returns only 2 questions (insufficient)
      const ragQuestions: Question[] = [
        {
          questionId: 'rag-q1',
          topicId: 'topic1',
          questionText: 'RAG Question 1',
          questionType: 'MultipleChoice',
          correctAnswer: 'A',
          syllabusReference: 'Section 1.1',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
        {
          questionId: 'rag-q2',
          topicId: 'topic1',
          questionText: 'RAG Question 2',
          questionType: 'MultipleChoice',
          correctAnswer: 'B',
          syllabusReference: 'Section 1.1',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
      ];

      // LLM generates the remaining 3 questions
      const llmQuestions: Question[] = [
        {
          questionId: 'llm-q1',
          topicId: 'topic1',
          questionText: 'LLM Question 1',
          questionType: 'MultipleChoice',
          correctAnswer: 'C',
          syllabusReference: 'Section 1.1',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
        {
          questionId: 'llm-q2',
          topicId: 'topic1',
          questionText: 'LLM Question 2',
          questionType: 'MultipleChoice',
          correctAnswer: 'D',
          syllabusReference: 'Section 1.1',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
        {
          questionId: 'llm-q3',
          topicId: 'topic1',
          questionText: 'LLM Question 3',
          questionType: 'MultipleChoice',
          correctAnswer: 'E',
          syllabusReference: 'Section 1.1',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
      ];

      mockPrisma.syllabusTopic.findMany.mockResolvedValue([{ id: 'topic1' }]);
      mockPrisma.question.count.mockResolvedValue(10);
      mockRagRetriever.retrieveQuestions.mockResolvedValue(Ok(ragQuestions));
      mockRagRetriever.getSyllabusContext.mockResolvedValue({
        topicId: 'topic1',
        content: 'Mathematics topic content',
        relatedConcepts: ['Addition', 'Subtraction'],
      });
      mockLlmGenerator.generateQuestions.mockResolvedValue(Ok(llmQuestions));
      mockPrisma.question.create.mockResolvedValue({ id: 'created-question' });
      mockRagRetriever.indexQuestion.mockResolvedValue(Ok(undefined));
      mockPrisma.test.create.mockResolvedValue({ id: 'test-1' });
      mockPrisma.testQuestion.create.mockResolvedValue({ id: 'tq-1' });

      const result = await testGenerator.generateTests(config, 'user-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const test = result.value[0];
        
        // Should have 5 questions total (2 from RAG + 3 from LLM)
        expect(test.questions).toHaveLength(5);
        
        // Verify LLM generator was called with correct parameters
        expect(mockLlmGenerator.generateQuestions).toHaveBeenCalledWith(
          expect.objectContaining({
            topicId: 'topic1',
            content: 'Mathematics topic content',
          }),
          3, // shortfall
          expect.arrayContaining([
            expect.objectContaining({ questionId: 'rag-q1' }),
            expect.objectContaining({ questionId: 'rag-q2' }),
          ])
        );
      }
    });

    it('should index LLM-generated questions for future use (Requirement 13.4)', async () => {
      const config: TestConfiguration = {
        subject: 'Mathematics',
        topics: ['topic1'],
        questionCount: 3,
        testCount: 1,
        testMode: 'InAppExam',
      };

      // RAG returns no questions
      mockPrisma.syllabusTopic.findMany.mockResolvedValue([{ id: 'topic1' }]);
      mockPrisma.question.count.mockResolvedValue(10);
      mockRagRetriever.retrieveQuestions.mockResolvedValue(Ok([]));
      mockRagRetriever.getSyllabusContext.mockResolvedValue({
        topicId: 'topic1',
        content: 'Mathematics topic content',
        relatedConcepts: ['Addition'],
      });

      const llmQuestions: Question[] = [
        {
          questionId: 'llm-q1',
          topicId: 'topic1',
          questionText: 'LLM Question 1',
          questionType: 'MultipleChoice',
          correctAnswer: 'A',
          syllabusReference: 'Section 1.1',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
        {
          questionId: 'llm-q2',
          topicId: 'topic1',
          questionText: 'LLM Question 2',
          questionType: 'MultipleChoice',
          correctAnswer: 'B',
          syllabusReference: 'Section 1.1',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
        {
          questionId: 'llm-q3',
          topicId: 'topic1',
          questionText: 'LLM Question 3',
          questionType: 'MultipleChoice',
          correctAnswer: 'C',
          syllabusReference: 'Section 1.1',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
      ];

      mockLlmGenerator.generateQuestions.mockResolvedValue(Ok(llmQuestions));
      mockPrisma.question.create.mockResolvedValue({ id: 'created-question' });
      mockRagRetriever.indexQuestion.mockResolvedValue(Ok(undefined));
      mockPrisma.test.create.mockResolvedValue({ id: 'test-1' });
      mockPrisma.testQuestion.create.mockResolvedValue({ id: 'tq-1' });

      const result = await testGenerator.generateTests(config, 'user-123');

      expect(result.ok).toBe(true);

      // Verify all LLM questions were persisted to database
      expect(mockPrisma.question.create).toHaveBeenCalledTimes(3);
      expect(mockPrisma.question.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'llm-q1',
          topicId: 'topic1',
          questionText: 'LLM Question 1',
        }),
      });

      // Verify all LLM questions were indexed in RAG vector store
      expect(mockRagRetriever.indexQuestion).toHaveBeenCalledTimes(3);
      expect(mockRagRetriever.indexQuestion).toHaveBeenCalledWith(
        expect.objectContaining({ questionId: 'llm-q1' })
      );
      expect(mockRagRetriever.indexQuestion).toHaveBeenCalledWith(
        expect.objectContaining({ questionId: 'llm-q2' })
      );
      expect(mockRagRetriever.indexQuestion).toHaveBeenCalledWith(
        expect.objectContaining({ questionId: 'llm-q3' })
      );
    });

    it('should handle multiple topics when using LLM fallback', async () => {
      const config: TestConfiguration = {
        subject: 'Mathematics',
        topics: ['topic1', 'topic2'],
        questionCount: 4,
        testCount: 1,
        testMode: 'InAppExam',
      };

      // RAG returns 1 question
      const ragQuestions: Question[] = [
        {
          questionId: 'rag-q1',
          topicId: 'topic1',
          questionText: 'RAG Question 1',
          questionType: 'MultipleChoice',
          correctAnswer: 'A',
          syllabusReference: 'Section 1.1',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
      ];

      mockPrisma.syllabusTopic.findMany.mockResolvedValue([
        { id: 'topic1' },
        { id: 'topic2' },
      ]);
      mockPrisma.question.count.mockResolvedValue(10);
      mockRagRetriever.retrieveQuestions.mockResolvedValue(Ok(ragQuestions));
      
      // Mock syllabus context for both topics
      mockRagRetriever.getSyllabusContext
        .mockResolvedValueOnce({
          topicId: 'topic1',
          content: 'Topic 1 content',
          relatedConcepts: ['Concept A'],
        })
        .mockResolvedValueOnce({
          topicId: 'topic2',
          content: 'Topic 2 content',
          relatedConcepts: ['Concept B'],
        });

      // LLM generates questions for each topic
      mockLlmGenerator.generateQuestions
        .mockResolvedValueOnce(Ok([
          {
            questionId: 'llm-q1',
            topicId: 'topic1',
            questionText: 'LLM Question 1',
            questionType: 'MultipleChoice',
            correctAnswer: 'B',
            syllabusReference: 'Section 1.1',
            difficulty: 'ExamRealistic',
            createdAt: new Date(),
          },
          {
            questionId: 'llm-q2',
            topicId: 'topic1',
            questionText: 'LLM Question 2',
            questionType: 'MultipleChoice',
            correctAnswer: 'C',
            syllabusReference: 'Section 1.1',
            difficulty: 'ExamRealistic',
            createdAt: new Date(),
          },
        ]))
        .mockResolvedValueOnce(Ok([
          {
            questionId: 'llm-q3',
            topicId: 'topic2',
            questionText: 'LLM Question 3',
            questionType: 'MultipleChoice',
            correctAnswer: 'D',
            syllabusReference: 'Section 2.1',
            difficulty: 'ExamRealistic',
            createdAt: new Date(),
          },
        ]));

      mockPrisma.question.create.mockResolvedValue({ id: 'created-question' });
      mockRagRetriever.indexQuestion.mockResolvedValue(Ok(undefined));
      mockPrisma.test.create.mockResolvedValue({ id: 'test-1' });
      mockPrisma.testQuestion.create.mockResolvedValue({ id: 'tq-1' });

      const result = await testGenerator.generateTests(config, 'user-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const test = result.value[0];
        
        // Should have 4 questions total (1 from RAG + up to 3 from LLM, sliced to exactly 4)
        // The LLM generates 2 questions (1 per topic call), so total is 1 + 2 = 3
        // But we requested 4, so we get 3 (1 RAG + 2 LLM)
        expect(test.questions).toHaveLength(4);
        
        // Verify LLM was called for both topics
        expect(mockLlmGenerator.generateQuestions).toHaveBeenCalledTimes(2);
      }
    });

    it('should fail gracefully when LLM generation fails', async () => {
      const config: TestConfiguration = {
        subject: 'Mathematics',
        topics: ['topic1'],
        questionCount: 5,
        testCount: 1,
        testMode: 'InAppExam',
      };

      // RAG returns insufficient questions
      const ragQuestions: Question[] = [
        {
          questionId: 'rag-q1',
          topicId: 'topic1',
          questionText: 'RAG Question 1',
          questionType: 'MultipleChoice',
          correctAnswer: 'A',
          syllabusReference: 'Section 1.1',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
      ];

      mockPrisma.syllabusTopic.findMany.mockResolvedValue([{ id: 'topic1' }]);
      mockPrisma.question.count.mockResolvedValue(10);
      mockRagRetriever.retrieveQuestions.mockResolvedValue(Ok(ragQuestions));
      mockRagRetriever.getSyllabusContext.mockResolvedValue({
        topicId: 'topic1',
        content: 'Mathematics topic content',
        relatedConcepts: ['Addition'],
      });

      // LLM generation fails
      mockLlmGenerator.generateQuestions.mockResolvedValue(
        Err({
          type: 'GenerationFailed',
          message: 'LLM API error',
        })
      );

      const result = await testGenerator.generateTests(config, 'user-123');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('GenerationFailed');
        expect(result.error.message).toContain('RAG retrieval insufficient');
        expect(result.error.message).toContain('LLM generation failed');
      }
    });

    it('should work without LLM generator when RAG is sufficient', async () => {
      // Create test generator without LLM
      const testGeneratorNoLLM = new TestGeneratorService(mockPrisma, mockRagRetriever);

      const config: TestConfiguration = {
        subject: 'Mathematics',
        topics: ['topic1'],
        questionCount: 3,
        testCount: 1,
        testMode: 'InAppExam',
      };

      const ragQuestions: Question[] = [
        {
          questionId: 'rag-q1',
          topicId: 'topic1',
          questionText: 'RAG Question 1',
          questionType: 'MultipleChoice',
          correctAnswer: 'A',
          syllabusReference: 'Section 1.1',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
        {
          questionId: 'rag-q2',
          topicId: 'topic1',
          questionText: 'RAG Question 2',
          questionType: 'MultipleChoice',
          correctAnswer: 'B',
          syllabusReference: 'Section 1.1',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
        {
          questionId: 'rag-q3',
          topicId: 'topic1',
          questionText: 'RAG Question 3',
          questionType: 'MultipleChoice',
          correctAnswer: 'C',
          syllabusReference: 'Section 1.1',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
      ];

      mockPrisma.syllabusTopic.findMany.mockResolvedValue([{ id: 'topic1' }]);
      mockPrisma.question.count.mockResolvedValue(10);
      mockRagRetriever.retrieveQuestions.mockResolvedValue(Ok(ragQuestions));
      mockPrisma.test.create.mockResolvedValue({ id: 'test-1' });
      mockPrisma.testQuestion.create.mockResolvedValue({ id: 'tq-1' });

      const result = await testGeneratorNoLLM.generateTests(config, 'user-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const test = result.value[0];
        expect(test.questions).toHaveLength(3);
        // All questions should be from RAG
        expect(test.questions.every(q => q.questionId.startsWith('rag-'))).toBe(true);
      }
    });

    it('should fail when RAG is insufficient and no LLM generator is available', async () => {
      // Create test generator without LLM
      const testGeneratorNoLLM = new TestGeneratorService(mockPrisma, mockRagRetriever);

      const config: TestConfiguration = {
        subject: 'Mathematics',
        topics: ['topic1'],
        questionCount: 5,
        testCount: 1,
        testMode: 'InAppExam',
      };

      // RAG returns insufficient questions
      const ragQuestions: Question[] = [
        {
          questionId: 'rag-q1',
          topicId: 'topic1',
          questionText: 'RAG Question 1',
          questionType: 'MultipleChoice',
          correctAnswer: 'A',
          syllabusReference: 'Section 1.1',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
      ];

      mockPrisma.syllabusTopic.findMany.mockResolvedValue([{ id: 'topic1' }]);
      mockPrisma.question.count.mockResolvedValue(10);
      mockRagRetriever.retrieveQuestions.mockResolvedValue(Ok(ragQuestions));

      const result = await testGeneratorNoLLM.generateTests(config, 'user-123');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('RetrievalError');
      }
    });

    it('should continue indexing even if some questions fail to index', async () => {
      const config: TestConfiguration = {
        subject: 'Mathematics',
        topics: ['topic1'],
        questionCount: 3,
        testCount: 1,
        testMode: 'InAppExam',
      };

      mockPrisma.syllabusTopic.findMany.mockResolvedValue([{ id: 'topic1' }]);
      mockPrisma.question.count.mockResolvedValue(10);
      mockRagRetriever.retrieveQuestions.mockResolvedValue(Ok([]));
      mockRagRetriever.getSyllabusContext.mockResolvedValue({
        topicId: 'topic1',
        content: 'Mathematics topic content',
        relatedConcepts: ['Addition'],
      });

      const llmQuestions: Question[] = [
        {
          questionId: 'llm-q1',
          topicId: 'topic1',
          questionText: 'LLM Question 1',
          questionType: 'MultipleChoice',
          correctAnswer: 'A',
          syllabusReference: 'Section 1.1',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
        {
          questionId: 'llm-q2',
          topicId: 'topic1',
          questionText: 'LLM Question 2',
          questionType: 'MultipleChoice',
          correctAnswer: 'B',
          syllabusReference: 'Section 1.1',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
        {
          questionId: 'llm-q3',
          topicId: 'topic1',
          questionText: 'LLM Question 3',
          questionType: 'MultipleChoice',
          correctAnswer: 'C',
          syllabusReference: 'Section 1.1',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
      ];

      mockLlmGenerator.generateQuestions.mockResolvedValue(Ok(llmQuestions));
      
      // First question succeeds, second fails, third succeeds
      mockPrisma.question.create
        .mockResolvedValueOnce({ id: 'created-q1' })
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce({ id: 'created-q3' });
      
      mockRagRetriever.indexQuestion.mockResolvedValue(Ok(undefined));
      mockPrisma.test.create.mockResolvedValue({ id: 'test-1' });
      mockPrisma.testQuestion.create.mockResolvedValue({ id: 'tq-1' });

      // Should not throw error - test generation should succeed
      const result = await testGenerator.generateTests(config, 'user-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const test = result.value[0];
        expect(test.questions).toHaveLength(3);
      }
    });

    it('should preserve question uniqueness across tests when using LLM fallback', async () => {
      const config: TestConfiguration = {
        subject: 'Mathematics',
        topics: ['topic1'],
        questionCount: 2,
        testCount: 2,
        testMode: 'InAppExam',
      };

      mockPrisma.syllabusTopic.findMany.mockResolvedValue([{ id: 'topic1' }]);
      mockPrisma.question.count.mockResolvedValue(10);

      // First test: RAG returns 1, LLM generates 1
      mockRagRetriever.retrieveQuestions
        .mockResolvedValueOnce(Ok([
          {
            questionId: 'rag-q1',
            topicId: 'topic1',
            questionText: 'RAG Question 1',
            questionType: 'MultipleChoice',
            correctAnswer: 'A',
            syllabusReference: 'Section 1.1',
            difficulty: 'ExamRealistic',
            createdAt: new Date(),
          },
        ]))
        // Second test: RAG returns 1, LLM generates 1
        .mockResolvedValueOnce(Ok([
          {
            questionId: 'rag-q2',
            topicId: 'topic1',
            questionText: 'RAG Question 2',
            questionType: 'MultipleChoice',
            correctAnswer: 'B',
            syllabusReference: 'Section 1.1',
            difficulty: 'ExamRealistic',
            createdAt: new Date(),
          },
        ]));

      mockRagRetriever.getSyllabusContext.mockResolvedValue({
        topicId: 'topic1',
        content: 'Mathematics topic content',
        relatedConcepts: ['Addition'],
      });

      mockLlmGenerator.generateQuestions
        .mockResolvedValueOnce(Ok([
          {
            questionId: 'llm-q1',
            topicId: 'topic1',
            questionText: 'LLM Question 1',
            questionType: 'MultipleChoice',
            correctAnswer: 'C',
            syllabusReference: 'Section 1.1',
            difficulty: 'ExamRealistic',
            createdAt: new Date(),
          },
        ]))
        .mockResolvedValueOnce(Ok([
          {
            questionId: 'llm-q2',
            topicId: 'topic1',
            questionText: 'LLM Question 2',
            questionType: 'MultipleChoice',
            correctAnswer: 'D',
            syllabusReference: 'Section 1.1',
            difficulty: 'ExamRealistic',
            createdAt: new Date(),
          },
        ]));

      mockPrisma.question.create.mockResolvedValue({ id: 'created-question' });
      mockRagRetriever.indexQuestion.mockResolvedValue(Ok(undefined));
      mockPrisma.test.create.mockResolvedValue({ id: 'test-1' });
      mockPrisma.testQuestion.create.mockResolvedValue({ id: 'tq-1' });

      const result = await testGenerator.generateTests(config, 'user-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const tests = result.value;
        expect(tests).toHaveLength(2);

        // Collect all question IDs
        const allQuestionIds = new Set<string>();
        tests.forEach(test => {
          test.questions.forEach(q => {
            // Each question ID should be unique
            expect(allQuestionIds.has(q.questionId)).toBe(false);
            allQuestionIds.add(q.questionId);
          });
        });

        expect(allQuestionIds.size).toBe(4); // 2 questions per test * 2 tests
      }
    });
  });
});

// ============================================================================
// Property-Based Tests for P1 Improvements
// ============================================================================

import * as fc from 'fast-check';
import { calculateBalancedDistribution } from './testGenerator';

describe('TestGeneratorService - Balanced Distribution (P1 Improvements)', () => {
  describe('Property Tests', () => {
    // Feature: p1-improvements, Property 12: Balanced Distribution Calculation
    // **Validates: Requirements 5.1, 5.3**
    it('Property 12: should calculate balanced distribution correctly for any Q and T where Q >= T', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }), // topicCount (T)
          fc.integer({ min: 1, max: 200 }), // totalQuestions (Q)
          (topicCount, totalQuestions) => {
            // Only test when Q >= T
            fc.pre(totalQuestions >= topicCount);
            
            // Generate topics
            const topics = Array.from({ length: topicCount }, (_, i) => ({
              topicId: `topic-${i}`,
              topicName: `Topic ${i}`,
            }));
            
            // Calculate distribution
            const distribution = calculateBalancedDistribution(topics, totalQuestions);
            
            // Verify: floor(Q/T) questions to each topic
            const baseQuestionsPerTopic = Math.floor(totalQuestions / topicCount);
            const remainder = totalQuestions % topicCount;
            
            // Check each topic's question count
            distribution.forEach((topicDist, index) => {
              const expectedCount = baseQuestionsPerTopic + (index < remainder ? 1 : 0);
              expect(topicDist.questionCount).toBe(expectedCount);
            });
            
            // Verify total questions sum equals totalQuestions
            const totalAssigned = distribution.reduce((sum, t) => sum + t.questionCount, 0);
            expect(totalAssigned).toBe(totalQuestions);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: p1-improvements, Property 13: Distribution Fairness
    // **Validates: Requirements 5.2**
    it('Property 13: should ensure max - min question count difference is at most 1', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }), // topicCount
          fc.integer({ min: 1, max: 200 }), // totalQuestions
          (topicCount, totalQuestions) => {
            // Generate topics
            const topics = Array.from({ length: topicCount }, (_, i) => ({
              topicId: `topic-${i}`,
              topicName: `Topic ${i}`,
            }));
            
            // Calculate distribution
            const distribution = calculateBalancedDistribution(topics, totalQuestions);
            
            // Find max and min question counts
            const questionCounts = distribution.map(t => t.questionCount);
            const maxCount = Math.max(...questionCounts);
            const minCount = Math.min(...questionCounts);
            
            // Verify fairness: difference should be at most 1
            expect(maxCount - minCount).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: p1-improvements, Property 14: Minimum Topic Coverage
    // **Validates: Requirements 5.4**
    it('Property 14: should ensure each topic gets at least one question when Q >= T', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }), // topicCount (T)
          fc.integer({ min: 1, max: 100 }), // totalQuestions (Q)
          (topicCount, totalQuestions) => {
            // Only test when Q >= T
            fc.pre(totalQuestions >= topicCount);
            
            // Generate topics
            const topics = Array.from({ length: topicCount }, (_, i) => ({
              topicId: `topic-${i}`,
              topicName: `Topic ${i}`,
            }));
            
            // Calculate distribution
            const distribution = calculateBalancedDistribution(topics, totalQuestions);
            
            // Verify each topic gets at least one question
            distribution.forEach(topicDist => {
              expect(topicDist.questionCount).toBeGreaterThanOrEqual(1);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge Cases', () => {
    // Requirement 5.5: More topics than questions
    it('should handle case when totalQuestions < topicCount', () => {
      const topics = [
        { topicId: 'topic1', topicName: 'Topic 1' },
        { topicId: 'topic2', topicName: 'Topic 2' },
        { topicId: 'topic3', topicName: 'Topic 3' },
        { topicId: 'topic4', topicName: 'Topic 4' },
        { topicId: 'topic5', topicName: 'Topic 5' },
      ];
      
      const distribution = calculateBalancedDistribution(topics, 3);
      
      // First 3 topics should get 1 question each
      expect(distribution[0].questionCount).toBe(1);
      expect(distribution[1].questionCount).toBe(1);
      expect(distribution[2].questionCount).toBe(1);
      
      // Remaining topics should get 0 questions
      expect(distribution[3].questionCount).toBe(0);
      expect(distribution[4].questionCount).toBe(0);
      
      // Total should equal requested questions
      const total = distribution.reduce((sum, t) => sum + t.questionCount, 0);
      expect(total).toBe(3);
    });

    it('should handle single topic', () => {
      const topics = [{ topicId: 'topic1', topicName: 'Topic 1' }];
      const distribution = calculateBalancedDistribution(topics, 10);
      
      expect(distribution).toHaveLength(1);
      expect(distribution[0].questionCount).toBe(10);
    });

    it('should handle empty topics array', () => {
      const distribution = calculateBalancedDistribution([], 10);
      expect(distribution).toHaveLength(0);
    });

    it('should handle zero questions', () => {
      const topics = [
        { topicId: 'topic1', topicName: 'Topic 1' },
        { topicId: 'topic2', topicName: 'Topic 2' },
      ];
      
      const distribution = calculateBalancedDistribution(topics, 0);
      
      expect(distribution).toHaveLength(2);
      expect(distribution[0].questionCount).toBe(0);
      expect(distribution[1].questionCount).toBe(0);
    });

    it('should distribute remainder questions to first N topics', () => {
      const topics = [
        { topicId: 'topic1', topicName: 'Topic 1' },
        { topicId: 'topic2', topicName: 'Topic 2' },
        { topicId: 'topic3', topicName: 'Topic 3' },
      ];
      
      // 10 questions / 3 topics = 3 base + 1 remainder
      const distribution = calculateBalancedDistribution(topics, 10);
      
      // First topic gets 3 + 1 = 4
      expect(distribution[0].questionCount).toBe(4);
      // Second topic gets 3
      expect(distribution[1].questionCount).toBe(3);
      // Third topic gets 3
      expect(distribution[2].questionCount).toBe(3);
      
      // Total = 10
      const total = distribution.reduce((sum, t) => sum + t.questionCount, 0);
      expect(total).toBe(10);
    });
  });
});
