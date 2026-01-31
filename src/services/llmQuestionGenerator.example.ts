// Example: Using LLM Question Generator as a fallback in test generation
// This demonstrates how to integrate the LLM generator when RAG retrieval is insufficient

import { PrismaClient } from '@prisma/client';
import { TestConfiguration, Question, Ok, Err } from '../types';
import { RAGRetrieverImpl } from './ragRetriever';
import { LLMQuestionGeneratorService } from './llmQuestionGenerator';
import { EmbeddingService } from './embedding';
import { InMemoryVectorStore } from './vectorStore';

/**
 * Enhanced Test Generator with LLM Fallback
 * 
 * This example shows how to:
 * 1. Try RAG retrieval first (primary method)
 * 2. Fall back to LLM generation when RAG is insufficient
 * 3. Index newly generated questions for future use
 */
export class TestGeneratorWithLLMFallback {
  private prisma: PrismaClient;
  private ragRetriever: RAGRetrieverImpl;
  private llmGenerator: LLMQuestionGeneratorService;

  constructor(
    prisma: PrismaClient,
    ragRetriever: RAGRetrieverImpl,
    llmGenerator: LLMQuestionGeneratorService
  ) {
    this.prisma = prisma;
    this.ragRetriever = ragRetriever;
    this.llmGenerator = llmGenerator;
  }

  /**
   * Generate questions with automatic fallback to LLM
   * Requirement 4.1: Use RAG architecture to retrieve syllabus-aligned content
   * Requirement 4.3: Use LLM when RAG retrieval is insufficient
   */
  async generateQuestionsWithFallback(
    config: TestConfiguration,
    excludeIds: string[]
  ): Promise<Question[]> {
    const allQuestions: Question[] = [];
    let remainingCount = config.questionCount;

    // Step 1: Try RAG retrieval first
    console.log(`Attempting to retrieve ${remainingCount} questions via RAG...`);
    
    const ragResult = await this.ragRetriever.retrieveQuestions(
      config.topics,
      remainingCount,
      excludeIds
    );

    if (ragResult.ok) {
      allQuestions.push(...ragResult.value);
      remainingCount -= ragResult.value.length;
      console.log(`RAG retrieved ${ragResult.value.length} questions`);
    } else {
      console.log(`RAG retrieval failed or insufficient: ${ragResult.error.type}`);
    }

    // Step 2: If we still need more questions, use LLM fallback
    if (remainingCount > 0) {
      console.log(`Need ${remainingCount} more questions, using LLM fallback...`);

      // Get syllabus context for each topic
      for (const topicId of config.topics) {
        if (remainingCount <= 0) break;

        const syllabusContext = await this.ragRetriever.getSyllabusContext(topicId);
        
        // Calculate how many questions to generate for this topic
        const questionsPerTopic = Math.ceil(remainingCount / config.topics.length);
        const countForThisTopic = Math.min(questionsPerTopic, remainingCount);

        // Generate questions using LLM
        const llmResult = await this.llmGenerator.generateQuestions(
          syllabusContext,
          countForThisTopic,
          allQuestions // Pass existing questions to avoid duplication
        );

        if (llmResult.ok) {
          const newQuestions = llmResult.value;
          console.log(`LLM generated ${newQuestions.length} questions for topic ${topicId}`);

          // Validate syllabus alignment for each generated question
          for (const question of newQuestions) {
            const alignmentResult = await this.llmGenerator.validateSyllabusAlignment(
              question,
              syllabusContext
            );

            if (alignmentResult.ok && alignmentResult.value.score >= 0.7) {
              allQuestions.push(question);
              remainingCount--;

              // Index the new question for future use
              await this.indexNewQuestion(question);
              console.log(`Indexed new question: ${question.questionId}`);
            } else {
              console.log(`Question rejected due to low alignment score`);
            }

            if (remainingCount <= 0) break;
          }
        } else {
          console.error(`LLM generation failed: ${llmResult.error.message}`);
        }
      }
    }

    console.log(`Total questions generated: ${allQuestions.length}`);
    return allQuestions;
  }

  /**
   * Index a newly generated question for future RAG retrieval
   * Requirement 13.4: Support updates to question bank
   */
  private async indexNewQuestion(question: Question): Promise<void> {
    try {
      // Save to database
      await this.prisma.question.create({
        data: {
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

      // Index in vector store for RAG retrieval
      await this.ragRetriever.indexQuestion(question);
    } catch (error) {
      console.error(`Failed to index question ${question.questionId}:`, error);
    }
  }
}

/**
 * Example usage
 */
export async function exampleUsage() {
  // Initialize services
  const prisma = new PrismaClient();
  const embeddingService = new EmbeddingService(process.env.GROQ_API_KEY || '');
  const vectorStore = new InMemoryVectorStore();
  const ragRetriever = new RAGRetrieverImpl(prisma, embeddingService, vectorStore);
  const llmGenerator = new LLMQuestionGeneratorService(process.env.GROQ_API_KEY || '');

  // Create enhanced test generator
  const testGenerator = new TestGeneratorWithLLMFallback(
    prisma,
    ragRetriever,
    llmGenerator
  );

  // Example configuration
  const config: TestConfiguration = {
    subject: 'Mathematics',
    topics: ['topic-addition', 'topic-subtraction'],
    questionCount: 10,
    testCount: 1,
    testMode: 'InAppExam',
  };

  // Generate questions with automatic fallback
  const questions = await testGenerator.generateQuestionsWithFallback(config, []);

  console.log(`Generated ${questions.length} questions`);
  questions.forEach((q, i) => {
    console.log(`${i + 1}. ${q.questionText} (${q.questionType})`);
  });

  await prisma.$disconnect();
}

// Uncomment to run the example
// exampleUsage().catch(console.error);
