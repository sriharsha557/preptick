// RAG Content Retriever implementation

import { PrismaClient } from '@prisma/client';
import {
  Question,
  QuestionId,
  TopicId,
  SyllabusContext,
  Result,
  RetrievalError,
  IndexError,
  Ok,
  Err,
} from '../types';
import { RAGRetriever } from './interfaces';
import { EmbeddingService } from './embedding';
import { InMemoryVectorStore, VectorEntry } from './vectorStore';

export class RAGRetrieverImpl implements RAGRetriever {
  private prisma: PrismaClient;
  private embeddingService: EmbeddingService;
  private vectorStore: InMemoryVectorStore;

  constructor(
    prisma: PrismaClient,
    embeddingService: EmbeddingService,
    vectorStore: InMemoryVectorStore
  ) {
    this.prisma = prisma;
    this.embeddingService = embeddingService;
    this.vectorStore = vectorStore;
  }

  /**
   * Retrieve questions for given topics using semantic search
   */
  async retrieveQuestions(
    topics: TopicId[],
    count: number,
    excludeIds: QuestionId[]
  ): Promise<Result<Question[], RetrievalError>> {
    try {
      // Get syllabus context for all topics
      const syllabusContexts = await Promise.all(
        topics.map(topicId => this.getSyllabusContext(topicId))
      );

      // Generate embeddings for each topic's syllabus context
      const topicEmbeddings = await Promise.all(
        syllabusContexts.map(context => 
          this.embeddingService.generateSyllabusEmbedding(context)
        )
      );

      // Average the embeddings to create a query embedding
      const queryEmbedding = this.averageEmbeddings(topicEmbeddings);

      // Search for similar questions in the vector store
      const excludeSet = new Set(excludeIds);
      const searchResults = await this.vectorStore.search(queryEmbedding, {
        topK: count * 3, // Get more results to account for filtering
        minSimilarity: 0.0, // No minimum similarity threshold - rely on topic filtering
        filter: (entry) => {
          // Filter by topics and exclude IDs
          const topicMatch = topics.includes(entry.metadata.topicId);
          const notExcluded = !entry.metadata.questionId || !excludeSet.has(entry.metadata.questionId);
          return topicMatch && notExcluded;
        },
      });

      // Extract questions from search results
      const questions: Question[] = [];
      for (const result of searchResults) {
        if (result.entry.metadata.question) {
          questions.push(result.entry.metadata.question);
        }
        if (questions.length >= count) {
          break;
        }
      }

      // Check if we have enough questions
      if (questions.length < count) {
        return Err({
          type: 'InsufficientMatches',
          found: questions.length,
          requested: count,
        });
      }

      return Ok(questions.slice(0, count));
    } catch (error) {
      return Err({
        type: 'VectorDBError',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check if a topic ID is LLM-generated (dynamically created, not in database)
   */
  private isLLMGeneratedTopic(topicId: TopicId): boolean {
    return topicId.startsWith('llm-');
  }

  /**
   * Parse topic information from LLM-generated topic ID
   * Format: llm-{curriculum}-{grade}-{subject}-{index}
   * Example: llm-cbse-10-mathematics-0
   */
  private parseLLMTopicId(topicId: TopicId): { curriculum: string; grade: number; subject: string; topicName: string } {
    // Remove 'llm-' prefix and split
    const parts = topicId.substring(4).split('-');

    // Format: curriculum-grade-subject-index (subject may have multiple dashes)
    if (parts.length < 4) {
      throw new Error(`Invalid LLM topic ID format: ${topicId}`);
    }

    const curriculum = parts[0].toUpperCase();
    const grade = parseInt(parts[1], 10);
    // Subject could span multiple parts (e.g., "social-studies")
    // Last part is the index, everything between grade and index is subject
    const index = parts[parts.length - 1];
    const subject = parts.slice(2, -1).join(' ');

    // Create a readable topic name from the subject and index
    const topicName = `${subject.charAt(0).toUpperCase() + subject.slice(1)} Topic ${parseInt(index, 10) + 1}`;

    return { curriculum, grade, subject, topicName };
  }

  /**
   * Get syllabus context for a topic
   * Handles both database topics and LLM-generated topics
   */
  async getSyllabusContext(topicId: TopicId): Promise<SyllabusContext> {
    // Handle LLM-generated topics
    if (this.isLLMGeneratedTopic(topicId)) {
      const { curriculum, grade, subject, topicName } = this.parseLLMTopicId(topicId);

      return {
        topicId,
        content: `${curriculum} Class ${grade} ${subject}: ${topicName}. Generate exam-realistic questions for this topic following the official ${curriculum} curriculum standards.`,
        relatedConcepts: [
          `${curriculum} curriculum standards`,
          `Class ${grade} level difficulty`,
          `${subject} fundamentals`,
        ],
      };
    }

    // Handle database topics
    const topic = await this.prisma.syllabusTopic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      throw new Error(`Topic not found: ${topicId}`);
    }

    // Parse learning objectives from JSON
    let learningObjectives: string[] = [];
    try {
      learningObjectives = JSON.parse(topic.learningObjectives);
    } catch {
      learningObjectives = [];
    }

    return {
      topicId: topic.id,
      content: `${topic.topicName}: ${topic.officialContent}`,
      relatedConcepts: learningObjectives,
    };
  }

  /**
   * Index a question in the vector store
   */
  async indexQuestion(question: Question): Promise<Result<void, IndexError>> {
    try {
      // Generate embedding for the question
      const embedding = await this.embeddingService.generateQuestionEmbedding(question);

      // Create vector entry
      const entry: VectorEntry = {
        id: question.questionId,
        embedding,
        metadata: {
          questionId: question.questionId,
          topicId: question.topicId,
          question,
        },
      };

      // Add to vector store
      await this.vectorStore.add(entry);

      return Ok(undefined);
    } catch (error) {
      return Err({
        type: 'IndexFailed',
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Index all questions from the database
   */
  async indexAllQuestions(): Promise<void> {
    const questions = await this.prisma.question.findMany();

    for (const dbQuestion of questions) {
      const question: Question = {
        questionId: dbQuestion.id,
        topicId: dbQuestion.topicId,
        questionText: dbQuestion.questionText,
        questionType: dbQuestion.questionType as any,
        options: dbQuestion.options ? JSON.parse(dbQuestion.options) : undefined,
        correctAnswer: dbQuestion.correctAnswer,
        syllabusReference: dbQuestion.syllabusReference,
        difficulty: 'ExamRealistic',
        createdAt: dbQuestion.createdAt,
      };

      await this.indexQuestion(question);
    }
  }

  /**
   * Average multiple embeddings into a single embedding
   */
  private averageEmbeddings(embeddings: number[][]): number[] {
    if (embeddings.length === 0) {
      throw new Error('Cannot average empty embeddings array');
    }

    const dimension = embeddings[0].length;
    const averaged = new Array(dimension).fill(0);

    for (const embedding of embeddings) {
      for (let i = 0; i < dimension; i++) {
        averaged[i] += embedding[i];
      }
    }

    // Divide by count and normalize
    const count = embeddings.length;
    for (let i = 0; i < dimension; i++) {
      averaged[i] /= count;
    }

    // Normalize the averaged embedding
    const magnitude = Math.sqrt(averaged.reduce((sum, val) => sum + val * val, 0));
    return averaged.map(val => magnitude > 0 ? val / magnitude : 0);
  }
}
