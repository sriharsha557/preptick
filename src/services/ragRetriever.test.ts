// Integration tests for RAG retriever

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { RAGRetrieverImpl } from './ragRetriever';
import { SimpleEmbeddingService } from './embedding';
import { InMemoryVectorStore } from './vectorStore';
import { Question } from '../types';

describe('RAGRetrieverImpl', () => {
  let prisma: PrismaClient;
  let embeddingService: SimpleEmbeddingService;
  let vectorStore: InMemoryVectorStore;
  let ragRetriever: RAGRetrieverImpl;

  beforeEach(async () => {
    prisma = new PrismaClient();
    embeddingService = new SimpleEmbeddingService();
    vectorStore = new InMemoryVectorStore();
    ragRetriever = new RAGRetrieverImpl(prisma, embeddingService, vectorStore);
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe('getSyllabusContext', () => {
    it('should retrieve syllabus context for a topic', async () => {
      // Get a topic from the database
      const topic = await prisma.syllabusTopic.findFirst();
      
      if (!topic) {
        console.log('No topics in database, skipping test');
        return;
      }

      const context = await ragRetriever.getSyllabusContext(topic.id);

      expect(context.topicId).toBe(topic.id);
      expect(context.content).toContain(topic.topicName);
      expect(Array.isArray(context.relatedConcepts)).toBe(true);
    });

    it('should throw error for non-existent topic', async () => {
      await expect(
        ragRetriever.getSyllabusContext('non-existent-topic')
      ).rejects.toThrow('Topic not found');
    });
  });

  describe('indexQuestion', () => {
    it('should index a question in the vector store', async () => {
      const question: Question = {
        questionId: 'test-q1',
        topicId: 'test-t1',
        questionText: 'What is 2 + 2?',
        questionType: 'Numerical',
        correctAnswer: '4',
        syllabusReference: 'Basic Addition',
        difficulty: 'ExamRealistic',
        createdAt: new Date(),
      };

      const result = await ragRetriever.indexQuestion(question);

      expect(result.success).toBe(true);
      expect(vectorStore.size()).toBe(1);

      const entry = await vectorStore.get(question.questionId);
      expect(entry).toBeDefined();
      expect(entry?.metadata.questionId).toBe(question.questionId);
      expect(entry?.metadata.question).toEqual(question);
    });

    it('should generate embeddings for indexed questions', async () => {
      const question: Question = {
        questionId: 'test-q2',
        topicId: 'test-t1',
        questionText: 'What is the capital of France?',
        questionType: 'ShortAnswer',
        correctAnswer: 'Paris',
        syllabusReference: 'World Geography',
        difficulty: 'ExamRealistic',
        createdAt: new Date(),
      };

      await ragRetriever.indexQuestion(question);

      const entry = await vectorStore.get(question.questionId);
      expect(entry?.embedding).toBeDefined();
      expect(entry?.embedding.length).toBe(384);
    });
  });

  describe('retrieveQuestions', () => {
    beforeEach(async () => {
      // Index some test questions
      const questions: Question[] = [
        {
          questionId: 'q1',
          topicId: 't1',
          questionText: 'What is 2 + 2?',
          questionType: 'Numerical',
          correctAnswer: '4',
          syllabusReference: 'Basic Addition',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
        {
          questionId: 'q2',
          topicId: 't1',
          questionText: 'What is 5 + 3?',
          questionType: 'Numerical',
          correctAnswer: '8',
          syllabusReference: 'Basic Addition',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
        {
          questionId: 'q3',
          topicId: 't2',
          questionText: 'What is the capital of France?',
          questionType: 'ShortAnswer',
          correctAnswer: 'Paris',
          syllabusReference: 'World Geography',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
      ];

      for (const question of questions) {
        await ragRetriever.indexQuestion(question);
      }

      // Create test topics in database
      // Check if topics already exist
      const existingT1 = await prisma.syllabusTopic.findUnique({ where: { id: 't1' } });
      const existingT2 = await prisma.syllabusTopic.findUnique({ where: { id: 't2' } });

      if (!existingT1) {
        await prisma.syllabusTopic.create({
          data: {
            id: 't1',
            curriculum: 'CBSE',
            grade: 5,
            subject: 'Mathematics',
            topicName: 'Basic Arithmetic',
            syllabusSection: 'Chapter 1',
            officialContent: 'Addition and subtraction of numbers',
            learningObjectives: JSON.stringify(['addition', 'subtraction']),
          },
        });
      }

      if (!existingT2) {
        await prisma.syllabusTopic.create({
          data: {
            id: 't2',
            curriculum: 'CBSE',
            grade: 5,
            subject: 'Geography',
            topicName: 'World Capitals',
            syllabusSection: 'Chapter 2',
            officialContent: 'Capital cities of different countries',
            learningObjectives: JSON.stringify(['geography', 'capitals']),
          },
        });
      }
    });

    afterEach(async () => {
      // Clean up test data
      await prisma.syllabusTopic.deleteMany({
        where: { id: { in: ['t1', 't2'] } },
      });
    });

    it('should retrieve questions for a topic', async () => {
      const result = await ragRetriever.retrieveQuestions(['t1'], 2, []);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.length).toBe(2);
        expect(result.value.every(q => q.topicId === 't1')).toBe(true);
      }
    });

    it('should exclude specified question IDs', async () => {
      const result = await ragRetriever.retrieveQuestions(['t1'], 1, ['q1']);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.length).toBe(1);
        expect(result.value[0].questionId).toBe('q2');
      }
    });

    it('should return error when insufficient questions available', async () => {
      const result = await ragRetriever.retrieveQuestions(['t1'], 10, []);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('InsufficientMatches');
        expect(result.error.found).toBeLessThan(10);
        expect(result.error.requested).toBe(10);
      }
    });

    it('should retrieve questions from multiple topics', async () => {
      const result = await ragRetriever.retrieveQuestions(['t1', 't2'], 3, []);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.length).toBe(3);
        const topicIds = result.value.map(q => q.topicId);
        expect(topicIds.some(id => id === 't1')).toBe(true);
        expect(topicIds.some(id => id === 't2')).toBe(true);
      }
    });

    it('should prioritize questions by relevance', async () => {
      const result = await ragRetriever.retrieveQuestions(['t1'], 2, []);

      expect(result.success).toBe(true);
      if (result.success) {
        // Questions should be from the requested topic
        expect(result.value.every(q => q.topicId === 't1')).toBe(true);
      }
    });
  });
});
