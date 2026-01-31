// Test Generator Service implementation

import { PrismaClient } from '@prisma/client';
import {
  TestConfiguration,
  MockTest,
  TestId,
  TopicId,
  Question,
  QuestionId,
  Result,
  ConfigurationError,
  GenerationError,
  Ok,
  Err,
} from '../types';
import { RAGRetriever, QuestionGenerator } from './interfaces';

export class TestGeneratorService {
  private prisma: PrismaClient;
  private ragRetriever: RAGRetriever;
  private llmGenerator?: QuestionGenerator;

  constructor(
    prisma: PrismaClient,
    ragRetriever: RAGRetriever,
    llmGenerator?: QuestionGenerator
  ) {
    this.prisma = prisma;
    this.ragRetriever = ragRetriever;
    this.llmGenerator = llmGenerator;
  }

  /**
   * Validate test configuration
   */
  async validateConfiguration(
    config: TestConfiguration
  ): Promise<Result<void, ConfigurationError>> {
    // Validate positive integers
    if (config.questionCount <= 0 || !Number.isInteger(config.questionCount)) {
      return Err({
        type: 'InvalidQuestionCount',
        value: config.questionCount,
        message: 'Question count must be a positive integer',
      });
    }

    if (config.testCount <= 0 || !Number.isInteger(config.testCount)) {
      return Err({
        type: 'InvalidTestCount',
        value: config.testCount,
        message: 'Test count must be a positive integer',
      });
    }

    // Validate topics exist in syllabus
    const topicValidation = await this.validateTopics(config.topics);
    if (!topicValidation.ok) {
      return topicValidation;
    }

    // Only check question availability if LLM is not available
    // When LLM is available, we can generate unlimited questions
    if (!this.llmGenerator) {
      const availabilityCheck = await this.checkQuestionAvailability(
        config.topics,
        config.questionCount * config.testCount,
        config.questionCount,
        config.testCount
      );
      if (!availabilityCheck.ok) {
        return availabilityCheck;
      }
    }

    return Ok(undefined);
  }

  /**
   * Check if a topic ID is LLM-generated (dynamically created, not in database)
   */
  private isLLMGeneratedTopic(topicId: TopicId): boolean {
    return topicId.startsWith('llm-');
  }

  /**
   * Validate that all topics exist in the syllabus
   * LLM-generated topics (starting with "llm-") are considered valid without database lookup
   */
  private async validateTopics(
    topics: TopicId[]
  ): Promise<Result<void, ConfigurationError>> {
    if (topics.length === 0) {
      return Err({
        type: 'NoTopicsSelected',
        message: 'At least one topic must be selected',
      });
    }

    // Separate LLM-generated topics from database topics
    const llmTopics = topics.filter(id => this.isLLMGeneratedTopic(id));
    const dbTopics = topics.filter(id => !this.isLLMGeneratedTopic(id));

    // LLM-generated topics are always valid - they were created by the syllabus API
    // Only validate database topics
    if (dbTopics.length > 0) {
      const existingTopics = await this.prisma.syllabusTopic.findMany({
        where: {
          id: {
            in: dbTopics,
          },
        },
        select: { id: true },
      });

      const existingIds = new Set(existingTopics.map(t => t.id));
      const missingTopics = dbTopics.filter(id => !existingIds.has(id));

      if (missingTopics.length > 0) {
        return Err({
          type: 'InvalidTopics',
          invalidTopics: missingTopics,
          message: `Topics not found in syllabus: ${missingTopics.join(', ')}`,
        });
      }
    }

    return Ok(undefined);
  }

  /**
   * Check if sufficient questions are available for the configuration
   * Requirement 14.2: Notify user and suggest reducing number of tests or questions
   */
  private async checkQuestionAvailability(
    topics: TopicId[],
    totalQuestionsNeeded: number,
    questionCount: number,
    testCount: number
  ): Promise<Result<void, ConfigurationError>> {
    // Count available questions for the selected topics
    const availableCount = await this.prisma.question.count({
      where: {
        topicId: {
          in: topics,
        },
      },
    });

    if (availableCount < totalQuestionsNeeded) {
      // Generate actionable suggestions based on the shortfall
      const suggestions = this.generateInsufficientQuestionsSuggestions(
        availableCount,
        totalQuestionsNeeded,
        questionCount,
        testCount
      );

      return Err({
        type: 'InsufficientQuestions',
        available: availableCount,
        requested: totalQuestionsNeeded,
        message: `Insufficient unique questions available. ${suggestions}`,
      });
    }

    return Ok(undefined);
  }

  /**
   * Generate actionable suggestions for insufficient questions error
   * Requirement 14.2: Include available count and suggested actions in error
   */
  private generateInsufficientQuestionsSuggestions(
    available: number,
    requested: number,
    questionCount: number,
    testCount: number
  ): string {
    const shortfall = requested - available;
    const suggestions: string[] = [];

    // Add available count information
    suggestions.push(`Available: ${available} questions, Requested: ${requested} questions (${shortfall} short).`);

    // Suggest specific actions
    suggestions.push('Suggested actions:');
    
    // Calculate how many questions per test would work with current test count
    const maxQuestionsPerTest = Math.floor(available / testCount);
    if (maxQuestionsPerTest > 0 && maxQuestionsPerTest < questionCount) {
      suggestions.push(`• Reduce the number of questions per test to ${maxQuestionsPerTest} or fewer`);
    }

    // Calculate how many tests could be generated with current question count
    const maxTests = Math.floor(available / questionCount);
    if (maxTests > 0 && maxTests < testCount) {
      suggestions.push(`• Reduce the number of tests to ${maxTests} or fewer`);
    }

    // Suggest selecting more topics
    suggestions.push('• Select additional topics to expand the question pool');

    // If very few questions available, suggest a different approach
    if (available === 0) {
      return 'No questions available for the selected topics. Please select different topics or contact support.';
    }

    return suggestions.join(' ');
  }

  /**
   * Generate mock tests based on configuration
   * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 13.4
   */
  async generateTests(
    config: TestConfiguration,
    userId?: string
  ): Promise<Result<MockTest[], GenerationError>> {
    // Validate configuration first
    const validation = await this.validateConfiguration(config);
    if (!validation.ok) {
      return Err({
        type: 'ConfigurationError',
        details: validation.error,
      });
    }

    const tests: MockTest[] = [];
    const usedQuestionIds: Set<QuestionId> = new Set();

    try {
      for (let i = 0; i < config.testCount; i++) {
        // ALWAYS use LLM to generate fresh questions for each test
        // This ensures every test is unique and prevents answer memorization
        let questions: Question[];

        if (this.llmGenerator) {
          // Generate all questions using LLM
          const llmQuestionsResult = await this.generateQuestionsWithLLM(
            config.topics,
            config.questionCount,
            Array.from(usedQuestionIds).map(id => {
              // Get previously used questions to avoid duplicates
              const existingQuestion = tests.flatMap(t => t.questions).find(q => q.questionId === id);
              return existingQuestion;
            }).filter(q => q !== undefined) as Question[]
          );

          if (!llmQuestionsResult.ok) {
            return Err({
              type: 'GenerationFailed',
              message: `LLM generation failed: ${llmQuestionsResult.error.message}`,
            });
          }

          questions = llmQuestionsResult.value;

          // Optionally index the newly generated questions for future reference
          // (but we won't use them for test generation - always generate fresh)
          await this.indexGeneratedQuestions(questions);
        } else {
          // Fallback to RAG if LLM is not available
          const questionsResult = await this.ragRetriever.retrieveQuestions(
            config.topics,
            config.questionCount,
            Array.from(usedQuestionIds)
          );

          if (!questionsResult.ok || questionsResult.value.length < config.questionCount) {
            return Err({
              type: 'GenerationFailed',
              message: 'LLM generator not available and insufficient questions in database',
            });
          }

          questions = questionsResult.value;
        }

        // Validate all questions match selected topics (Requirement 4.2)
        const topicValidation = this.validateQuestionTopics(questions, config.topics);
        if (!topicValidation.ok) {
          return Err({
            type: 'GenerationFailed',
            message: `Question topic mismatch: ${topicValidation.error}`,
          });
        }

        // Ensure exam-realistic difficulty (Requirement 4.3)
        // All questions are already marked as 'ExamRealistic' difficulty
        const difficultyValidation = this.validateQuestionDifficulty(questions);
        if (!difficultyValidation.ok) {
          return Err({
            type: 'GenerationFailed',
            message: `Question difficulty validation failed: ${difficultyValidation.error}`,
          });
        }

        // Mark questions as used to ensure uniqueness across tests (Requirement 4.4)
        questions.forEach(q => usedQuestionIds.add(q.questionId));

        // Generate answer key with correct answers (Requirement 4.5)
        const answerKey = this.generateAnswerKey(questions);

        // Create test with unique ID
        const test: MockTest = {
          testId: `test-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
          configuration: config,
          questions,
          answerKey,
          createdAt: new Date(),
        };

        // Persist test configuration and generated test
        await this.persistTest(test, userId);

        tests.push(test);
      }

      return Ok(tests);
    } catch (error) {
      return Err({
        type: 'GenerationFailed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Validate that all questions match the selected topics
   * Requirement 4.2: Ensure all questions match selected topics from official syllabus
   */
  private validateQuestionTopics(
    questions: Question[],
    selectedTopics: TopicId[]
  ): Result<void, string> {
    const topicSet = new Set(selectedTopics);
    
    for (const question of questions) {
      if (!topicSet.has(question.topicId)) {
        return Err(
          `Question ${question.questionId} has topic ${question.topicId} which is not in selected topics`
        );
      }
    }
    
    return Ok(undefined);
  }

  /**
   * Validate that all questions have exam-realistic difficulty
   * Requirement 4.3: Generate questions at exam-realistic difficulty
   */
  private validateQuestionDifficulty(questions: Question[]): Result<void, string> {
    for (const question of questions) {
      if (question.difficulty !== 'ExamRealistic') {
        return Err(
          `Question ${question.questionId} has difficulty ${question.difficulty}, expected ExamRealistic`
        );
      }
    }
    
    return Ok(undefined);
  }

  /**
   * Generate answer key for questions
   */
  private generateAnswerKey(questions: Question[]): Map<QuestionId, string> {
    const answerKey = new Map<QuestionId, string>();
    
    for (const question of questions) {
      answerKey.set(question.questionId, question.correctAnswer);
    }

    return answerKey;
  }

  /**
   * Generate questions using LLM for topics when RAG is insufficient
   * Requirement 13.4: Use LLM when RAG retrieval is insufficient
   */
  private async generateQuestionsWithLLM(
    topics: TopicId[],
    count: number,
    existingQuestions: Question[]
  ): Promise<Result<Question[], GenerationError>> {
    if (!this.llmGenerator) {
      return Err({
        type: 'GenerationFailed',
        message: 'LLM generator not available',
      });
    }

    const allGeneratedQuestions: Question[] = [];

    // Generate questions for each topic proportionally
    const questionsPerTopic = Math.ceil(count / topics.length);

    for (const topicId of topics) {
      if (allGeneratedQuestions.length >= count) {
        break;
      }

      // Get syllabus context for the topic
      const syllabusContext = await this.ragRetriever.getSyllabusContext(topicId);

      // Calculate how many questions we still need
      const remainingCount = count - allGeneratedQuestions.length;
      const questionsToGenerate = Math.min(questionsPerTopic, remainingCount);

      // Generate questions using LLM
      const result = await this.llmGenerator.generateQuestions(
        syllabusContext,
        questionsToGenerate,
        [...existingQuestions, ...allGeneratedQuestions]
      );

      if (!result.ok) {
        return result;
      }

      allGeneratedQuestions.push(...result.value);
    }

    // Return exactly the number of questions requested
    return Ok(allGeneratedQuestions.slice(0, count));
  }

  /**
   * Index generated questions for future use
   * Requirement 13.4: Ensure generated questions are indexed for future use
   */
  private async indexGeneratedQuestions(questions: Question[]): Promise<void> {
    // First, persist questions to the database
    for (const question of questions) {
      try {
        // Use upsert to handle cases where question might already exist
        await this.prisma.question.upsert({
          where: { id: question.questionId },
          update: {
            // Update if exists (shouldn't happen with unique IDs, but just in case)
            questionText: question.questionText,
            questionType: question.questionType,
            options: question.options ? JSON.stringify(question.options) : null,
            correctAnswer: question.correctAnswer,
            syllabusReference: question.syllabusReference,
          },
          create: {
            id: question.questionId,
            topicId: question.topicId,
            questionText: question.questionText,
            questionType: question.questionType,
            options: question.options ? JSON.stringify(question.options) : null,
            correctAnswer: question.correctAnswer,
            syllabusReference: question.syllabusReference,
            createdAt: question.createdAt,
          },
        });

        // Index in RAG vector store for future retrieval
        await this.ragRetriever.indexQuestion(question);
      } catch (error) {
        // Log error and rethrow - we need questions to be saved for test generation to work
        console.error(`Failed to index question ${question.questionId}:`, error);
        throw new Error(`Failed to save question to database: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Persist test to database
   * Stores test configuration and generated test with all questions
   */
  private async persistTest(test: MockTest, userId?: string): Promise<void> {
    // Create the Test record with configuration
    const createdTest = await this.prisma.test.create({
      data: {
        id: test.testId,
        userId: userId || 'system', // Use provided userId or 'system' for tests
        subject: test.configuration.subject,
        topics: JSON.stringify(test.configuration.topics),
        mode: test.configuration.testMode,
        status: 'Generated',
        createdAt: test.createdAt,
      },
    });

    // Create TestQuestion records for each question with proper ordering
    const testQuestionPromises = test.questions.map((question, index) =>
      this.prisma.testQuestion.create({
        data: {
          testId: createdTest.id,
          questionId: question.questionId,
          order: index,
        },
      })
    );

    await Promise.all(testQuestionPromises);
  }
}
