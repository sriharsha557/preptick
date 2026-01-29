// Unit tests for embedding service

import { describe, it, expect } from 'vitest';
import { SimpleEmbeddingService } from './embedding';
import { Question, SyllabusContext } from '../types';

describe('SimpleEmbeddingService', () => {
  const service = new SimpleEmbeddingService();

  describe('generateTextEmbedding', () => {
    it('should generate embeddings of correct dimension', async () => {
      const text = 'This is a test question about mathematics';
      const embedding = await service.generateTextEmbedding(text);

      expect(embedding).toHaveLength(384);
      expect(embedding.every(val => typeof val === 'number')).toBe(true);
    });

    it('should generate normalized embeddings', async () => {
      const text = 'Test question';
      const embedding = await service.generateTextEmbedding(text);

      // Calculate magnitude
      const magnitude = Math.sqrt(
        embedding.reduce((sum, val) => sum + val * val, 0)
      );

      expect(magnitude).toBeCloseTo(1, 5);
    });

    it('should generate deterministic embeddings for same text', async () => {
      const text = 'Consistent test text';
      const embedding1 = await service.generateTextEmbedding(text);
      const embedding2 = await service.generateTextEmbedding(text);

      expect(embedding1).toEqual(embedding2);
    });

    it('should generate different embeddings for different text', async () => {
      const text1 = 'First test text';
      const text2 = 'Second test text';
      const embedding1 = await service.generateTextEmbedding(text1);
      const embedding2 = await service.generateTextEmbedding(text2);

      expect(embedding1).not.toEqual(embedding2);
    });

    it('should handle empty text', async () => {
      const text = '';
      const embedding = await service.generateTextEmbedding(text);

      expect(embedding).toHaveLength(384);
      expect(embedding.every(val => val === 0)).toBe(true);
    });
  });

  describe('generateQuestionEmbedding', () => {
    it('should generate embedding for a question', async () => {
      const question: Question = {
        questionId: 'q1',
        topicId: 't1',
        questionText: 'What is 2 + 2?',
        questionType: 'Numerical',
        correctAnswer: '4',
        syllabusReference: 'Basic Addition',
        difficulty: 'ExamRealistic',
        createdAt: new Date(),
      };

      const embedding = await service.generateQuestionEmbedding(question);

      expect(embedding).toHaveLength(384);
      expect(embedding.every(val => typeof val === 'number')).toBe(true);
    });

    it('should incorporate syllabus reference in embedding', async () => {
      const question1: Question = {
        questionId: 'q1',
        topicId: 't1',
        questionText: 'What is 2 + 2?',
        questionType: 'Numerical',
        correctAnswer: '4',
        syllabusReference: 'Basic Addition',
        difficulty: 'ExamRealistic',
        createdAt: new Date(),
      };

      const question2: Question = {
        ...question1,
        questionId: 'q2',
        syllabusReference: 'Advanced Calculus',
      };

      const embedding1 = await service.generateQuestionEmbedding(question1);
      const embedding2 = await service.generateQuestionEmbedding(question2);

      expect(embedding1).not.toEqual(embedding2);
    });
  });

  describe('generateSyllabusEmbedding', () => {
    it('should generate embedding for syllabus context', async () => {
      const context: SyllabusContext = {
        topicId: 't1',
        content: 'Basic arithmetic operations including addition and subtraction',
        relatedConcepts: ['addition', 'subtraction', 'numbers'],
      };

      const embedding = await service.generateSyllabusEmbedding(context);

      expect(embedding).toHaveLength(384);
      expect(embedding.every(val => typeof val === 'number')).toBe(true);
    });

    it('should incorporate related concepts in embedding', async () => {
      const context1: SyllabusContext = {
        topicId: 't1',
        content: 'Mathematics',
        relatedConcepts: ['addition', 'subtraction'],
      };

      const context2: SyllabusContext = {
        topicId: 't1',
        content: 'Mathematics',
        relatedConcepts: ['multiplication', 'division'],
      };

      const embedding1 = await service.generateSyllabusEmbedding(context1);
      const embedding2 = await service.generateSyllabusEmbedding(context2);

      expect(embedding1).not.toEqual(embedding2);
    });
  });
});
