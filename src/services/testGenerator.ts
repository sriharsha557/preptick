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
import { generateQuestionPaper, generateAnswerKey } from './pdfGenerator';

/**
 * Topic distribution for balanced question allocation
 */
export interface TopicDistribution {
  topicId: TopicId;
  topicName: string;
  questionCount: number;
}

/**
 * Calculate balanced distribution of questions across topics
 * Requirements: 5.1, 5.3
 * 
 * @param topics - Array of topics with their IDs and names
 * @param totalQuestions - Total number of questions to distribute
 * @returns Array of TopicDistribution with balanced question counts
 * 
 * Algorithm:
 * - Calculate base questions per topic: floor(totalQuestions / topicCount)
 * - Calculate remainder: totalQuestions % topicCount
 * - Assign base questions to all topics
 * - Distribute remainder questions one per topic to first N topics
 */
export function calculateBalancedDistribution(
  topics: Array<{ topicId: TopicId; topicName: string }>,
  totalQuestions: number
): TopicDistribution[] {
  const topicCount = topics.length;
  
  if (topicCount === 0) {
    return [];
  }
  
  if (totalQuestions <= 0) {
    return topics.map(topic => ({
      topicId: topic.topicId,
      topicName: topic.topicName,
      questionCount: 0,
    }));
  }
  
  const baseQuestionsPerTopic = Math.floor(totalQuestions / topicCount);
  const remainder = totalQuestions % topicCount;
  
  return topics.map((topic, index) => ({
    topicId: topic.topicId,
    topicName: topic.topicName,
    questionCount: baseQuestionsPerTopic + (index < remainder ? 1 : 0),
  }));
}

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
   * Check if a topic ID is dynamically created (LLM-generated or custom user-provided)
   * These topics don't exist in the database and should be auto-validated
   */
  private isLLMGeneratedTopic(topicId: TopicId): boolean {
    return topicId.startsWith('llm-') || topicId.startsWith('custom-');
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
   * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 13.4, 5.1, 5.2, 5.3, 5.4, 3.1, 3.2, 3.3
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
          // Use balanced distribution to generate questions across topics
          // Requirements: 5.1, 5.2, 5.3, 5.4
          const topicsWithNames = await this.getTopicNames(config.topics);
          const distribution = calculateBalancedDistribution(
            topicsWithNames,
            config.questionCount
          );

          // Generate questions per topic according to balanced distribution
          const allQuestions: Question[] = [];
          for (const topicDist of distribution) {
            if (topicDist.questionCount === 0) continue;

            const syllabusContext = await this.ragRetriever.getSyllabusContext(topicDist.topicId);
            const existingQuestions = Array.from(usedQuestionIds).map(id => {
              const existingQuestion = tests.flatMap(t => t.questions).find(q => q.questionId === id);
              return existingQuestion;
            }).filter(q => q !== undefined) as Question[];

            const result = await this.llmGenerator.generateQuestions(
              syllabusContext,
              topicDist.questionCount,
              [...existingQuestions, ...allQuestions],
              config.subject
            );

            if (!result.ok) {
              return Err({
                type: 'GenerationFailed',
                message: `LLM generation failed for topic ${topicDist.topicName}: ${result.error.message}`,
              });
            }

            allQuestions.push(...result.value);
          }

          questions = allQuestions;

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

        // Persist test configuration and generated test with dual PDFs
        // Requirements: 3.1, 3.2, 3.3
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
   * Get topic names for topic IDs
   * Helper method to fetch topic names from database
   */
  private async getTopicNames(
    topicIds: TopicId[]
  ): Promise<Array<{ topicId: TopicId; topicName: string }>> {
    try {
      const topics = await this.prisma.syllabusTopic.findMany({
        where: {
          id: {
            in: topicIds,
          },
        },
        select: {
          id: true,
          topicName: true,
        },
      });

      // Create a map for quick lookup
      const topicMap = new Map(topics.map(t => [t.id, t.topicName]));

      // Return in the same order as input, with fallback names for LLM-generated topics
      return topicIds.map(id => ({
        topicId: id,
        topicName: topicMap.get(id) || id.replace('llm-', '').replace(/-/g, ' '),
      }));
    } catch (error) {
      // Fallback for tests or when database is unavailable
      return topicIds.map(id => ({
        topicId: id,
        topicName: id.replace('llm-', '').replace(/-/g, ' '),
      }));
    }
  }

  /**
   * Index generated questions for future use
   * Requirement 13.4: Ensure generated questions are indexed for future use
   */
  private async indexGeneratedQuestions(questions: Question[]): Promise<void> {
    // First, ensure all topics exist in the database
    const uniqueTopicIds = [...new Set(questions.map(q => q.topicId))];
    
    for (const topicId of uniqueTopicIds) {
      try {
        // Check if topic exists
        const existingTopic = await this.prisma.syllabusTopic.findUnique({
          where: { id: topicId },
        });

        if (!existingTopic) {
          // Topic doesn't exist - create it
          // Parse LLM topic ID to extract information
          if (topicId.startsWith('llm-') || topicId.startsWith('custom-')) {
            const prefix = topicId.startsWith('llm-') ? 'llm-' : 'custom-';
            const parts = topicId.substring(prefix.length).split('-');
            const curriculum = parts[0].toUpperCase();
            const grade = parseInt(parts[1], 10) || 10;
            // Join remaining parts as subject, handling multi-word subjects
            const subjectParts = parts.slice(2);
            const subject = subjectParts.length > 0
              ? subjectParts.join(' ').replace(/^\w/, c => c.toUpperCase())
              : 'General';
            const topicName = `${subject} Topic`;

            await this.prisma.syllabusTopic.create({
              data: {
                id: topicId,
                curriculum,
                grade,
                subject,
                topicName,
                syllabusSection: 'LLM Generated',
                officialContent: `Auto-generated topic for ${curriculum} Class ${grade} ${subject}`,
                learningObjectives: JSON.stringify([]),
              },
            });
            console.log(`Created topic: ${topicId}`);
          } else {
            // Non-LLM topic that doesn't exist - this is a problem
            throw new Error(`Topic ${topicId} does not exist in the database and cannot be auto-created`);
          }
        }
      } catch (error) {
        // Topic creation failure is critical for question creation
        console.error(`Failed to ensure topic ${topicId} exists:`, error);
        throw new Error(`Failed to create topic ${topicId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Now persist questions to the database - this MUST succeed for test persistence to work
    for (const question of questions) {
      try {
        // Use upsert to handle cases where question might already exist
        // Format correct answer as JSON array (schema supports multiple correct answers)
        const correctAnswersJson = JSON.stringify([question.correctAnswer]);

        await this.prisma.question.upsert({
          where: { id: question.questionId },
          update: {
            // Update if exists (shouldn't happen with unique IDs, but just in case)
            questionText: question.questionText,
            questionType: question.questionType,
            options: question.options ? JSON.stringify(question.options) : null,
            correctAnswers: correctAnswersJson,
            solutionSteps: question.solutionSteps ? JSON.stringify(question.solutionSteps) : '[]',
            syllabusReference: question.syllabusReference,
          },
          create: {
            id: question.questionId,
            topicId: question.topicId,
            questionText: question.questionText,
            questionType: question.questionType,
            options: question.options ? JSON.stringify(question.options) : null,
            correctAnswers: correctAnswersJson,
            solutionSteps: question.solutionSteps ? JSON.stringify(question.solutionSteps) : '[]',
            syllabusReference: question.syllabusReference,
            createdAt: question.createdAt,
          },
        });

        // Index in RAG vector store for future retrieval (non-critical)
        try {
          await this.ragRetriever.indexQuestion(question);
        } catch (ragError) {
          console.warn(`RAG indexing failed for question ${question.questionId}:`, ragError);
        }
      } catch (error) {
        // Question creation failure is critical - throw to prevent test creation
        console.error(`Failed to create question ${question.questionId}:`, error);
        throw new Error(`Failed to save question to database: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Persist test to database with dual PDFs
   * Stores test configuration and generated test with all questions
   * Requirements: 3.1, 3.2, 3.3
   */
  private async persistTest(test: MockTest, userId?: string): Promise<void> {
    // Get topic names for PDF generation
    const topicNames = await this.getTopicNames(test.configuration.topics);
    const topicNamesList = topicNames.map(t => t.topicName);

    // Generate question paper PDF (without answers)
    // Requirement 3.2: Question paper contains only questions
    let questionPaperBuffer: Buffer | undefined;
    let answerKeyBuffer: Buffer | undefined;

    try {
      const questionPaperResult = await generateQuestionPaper(test, topicNamesList);
      if (questionPaperResult.ok) {
        questionPaperBuffer = questionPaperResult.value.buffer;
      }

      // Generate answer key PDF (with answers and solutions)
      // Requirement 3.3: Answer key contains questions with answers and solutions
      const answerKeyResult = await generateAnswerKey(test, topicNamesList);
      if (answerKeyResult.ok) {
        answerKeyBuffer = answerKeyResult.value.buffer;
      }
    } catch (error) {
      // Log error but don't fail test generation if PDF generation fails
      console.error('PDF generation failed:', error);
    }

    // Create the Test record with configuration and dual PDFs
    const createdTest = await this.prisma.test.create({
      data: {
        id: test.testId,
        userId: userId || 'system', // Use provided userId or 'system' for tests
        subject: test.configuration.subject,
        topics: JSON.stringify(test.configuration.topics),
        mode: test.configuration.testMode,
        status: 'Generated',
        questionPaperPDF: questionPaperBuffer, // Store question paper PDF
        answerKeyPDF: answerKeyBuffer, // Store answer key PDF
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
