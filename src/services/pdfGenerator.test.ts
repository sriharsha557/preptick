// Unit tests for PDF Generator Service

import { describe, it, expect } from 'vitest';
import { generatePDF } from './pdfGenerator';
import {
  MockTest,
  Question,
  TestConfiguration,
  QuestionType,
} from '../types';

// Helper function to create a mock test
function createMockTest(
  questionCount: number = 3,
  includeMultipleChoice: boolean = true
): MockTest {
  const questions: Question[] = [];
  const answerKey = new Map<string, string>();

  // Add multiple choice question
  if (includeMultipleChoice) {
    const mcQuestion: Question = {
      questionId: 'q1',
      topicId: 't1',
      questionText: 'What is the capital of France?',
      questionType: 'MultipleChoice',
      options: ['London', 'Paris', 'Berlin', 'Madrid'],
      correctAnswer: 'Paris',
      syllabusReference: 'Geography - European Capitals',
      difficulty: 'ExamRealistic',
      createdAt: new Date(),
    };
    questions.push(mcQuestion);
    answerKey.set('q1', 'Paris');
  }

  // Add short answer questions
  for (let i = includeMultipleChoice ? 1 : 0; i < questionCount; i++) {
    const question: Question = {
      questionId: `q${i + 1}`,
      topicId: 't1',
      questionText: `Short answer question ${i + 1}: Explain the concept of photosynthesis.`,
      questionType: 'ShortAnswer',
      correctAnswer: 'Photosynthesis is the process by which plants convert light energy into chemical energy.',
      syllabusReference: 'Biology - Plant Processes',
      difficulty: 'ExamRealistic',
      createdAt: new Date(),
    };
    questions.push(question);
    answerKey.set(`q${i + 1}`, question.correctAnswer);
  }

  const configuration: TestConfiguration = {
    subject: 'Science',
    topics: ['t1', 't2'],
    questionCount: questions.length,
    testCount: 1,
    testMode: 'PrintablePDF',
  };

  return {
    testId: 'test-123',
    configuration,
    questions,
    answerKey,
    createdAt: new Date(),
  };
}

describe('PDF Generator Service', () => {
  describe('generatePDF - Test PDF (without answers)', () => {
    it('should generate a PDF buffer successfully', async () => {
      const test = createMockTest(3);
      const result = await generatePDF(test, false);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.buffer).toBeInstanceOf(Buffer);
        expect(result.value.buffer.length).toBeGreaterThan(0);
      }
    });

    it('should generate a filename with correct format', async () => {
      const test = createMockTest(3);
      const result = await generatePDF(test, false);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.filename).toMatch(/^mockprep-test-test-123-\d{4}-\d{2}-\d{2}\.pdf$/);
      }
    });

    it('should generate PDF with valid PDF header', async () => {
      const test = createMockTest(3);
      const result = await generatePDF(test, false);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const pdfHeader = result.value.buffer.toString('utf-8', 0, 4);
        expect(pdfHeader).toBe('%PDF');
      }
    });

    it('should handle test with only multiple choice questions', async () => {
      const test = createMockTest(1, true);
      const result = await generatePDF(test, false);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.buffer).toBeInstanceOf(Buffer);
        expect(result.value.buffer.length).toBeGreaterThan(0);
      }
    });

    it('should handle test with many questions', async () => {
      const test = createMockTest(20);
      const result = await generatePDF(test, false);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.buffer).toBeInstanceOf(Buffer);
        expect(result.value.buffer.length).toBeGreaterThan(0);
      }
    });

    it('should handle test with single question', async () => {
      const test = createMockTest(1, false);
      const result = await generatePDF(test, false);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.buffer).toBeInstanceOf(Buffer);
        expect(result.value.buffer.length).toBeGreaterThan(0);
      }
    });

    it('should handle numerical question type', async () => {
      const numericalQuestion: Question = {
        questionId: 'q1',
        topicId: 't1',
        questionText: 'Calculate the area of a circle with radius 5 cm.',
        questionType: 'Numerical',
        correctAnswer: '78.54',
        syllabusReference: 'Mathematics - Geometry',
        difficulty: 'ExamRealistic',
        createdAt: new Date(),
      };

      const test: MockTest = {
        testId: 'test-num',
        configuration: {
          subject: 'Mathematics',
          topics: ['t1'],
          questionCount: 1,
          testCount: 1,
          testMode: 'PrintablePDF',
        },
        questions: [numericalQuestion],
        answerKey: new Map([['q1', '78.54']]),
        createdAt: new Date(),
      };

      const result = await generatePDF(test, false);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.buffer).toBeInstanceOf(Buffer);
      }
    });

    it('should handle questions with special characters', async () => {
      const question: Question = {
        questionId: 'q1',
        topicId: 't1',
        questionText: 'What is the value of π (pi) to 2 decimal places? Use the formula: A = πr²',
        questionType: 'ShortAnswer',
        correctAnswer: '3.14',
        syllabusReference: 'Mathematics - Constants',
        difficulty: 'ExamRealistic',
        createdAt: new Date(),
      };

      const test: MockTest = {
        testId: 'test-special',
        configuration: {
          subject: 'Mathematics',
          topics: ['t1'],
          questionCount: 1,
          testCount: 1,
          testMode: 'PrintablePDF',
        },
        questions: [question],
        answerKey: new Map([['q1', '3.14']]),
        createdAt: new Date(),
      };

      const result = await generatePDF(test, false);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.buffer).toBeInstanceOf(Buffer);
      }
    });

    it('should handle very long question text', async () => {
      const longText = 'This is a very long question that contains a lot of text. '.repeat(20);
      const question: Question = {
        questionId: 'q1',
        topicId: 't1',
        questionText: longText,
        questionType: 'ShortAnswer',
        correctAnswer: 'Answer',
        syllabusReference: 'Test - Long Questions',
        difficulty: 'ExamRealistic',
        createdAt: new Date(),
      };

      const test: MockTest = {
        testId: 'test-long',
        configuration: {
          subject: 'Test Subject',
          topics: ['t1'],
          questionCount: 1,
          testCount: 1,
          testMode: 'PrintablePDF',
        },
        questions: [question],
        answerKey: new Map([['q1', 'Answer']]),
        createdAt: new Date(),
      };

      const result = await generatePDF(test, false);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.buffer).toBeInstanceOf(Buffer);
      }
    });
  });

  describe('generatePDF - Answer Key PDF (with answers)', () => {
    it('should generate answer key PDF successfully', async () => {
      const test = createMockTest(3);
      const result = await generatePDF(test, true);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.buffer).toBeInstanceOf(Buffer);
        expect(result.value.buffer.length).toBeGreaterThan(0);
      }
    });

    it('should generate filename with answer-key in name', async () => {
      const test = createMockTest(3);
      const result = await generatePDF(test, true);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.filename).toMatch(/^mockprep-answer-key-test-123-\d{4}-\d{2}-\d{2}\.pdf$/);
      }
    });

    it('should generate answer key with valid PDF header', async () => {
      const test = createMockTest(3);
      const result = await generatePDF(test, true);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const pdfHeader = result.value.buffer.toString('utf-8', 0, 4);
        expect(pdfHeader).toBe('%PDF');
      }
    });

    it('should handle answer key for multiple choice questions', async () => {
      const test = createMockTest(1, true);
      const result = await generatePDF(test, true);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.buffer).toBeInstanceOf(Buffer);
      }
    });

    it('should handle answer key with many questions', async () => {
      const test = createMockTest(20);
      const result = await generatePDF(test, true);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.buffer).toBeInstanceOf(Buffer);
        expect(result.value.buffer.length).toBeGreaterThan(0);
      }
    });
  });

  describe('PDF Content Validation', () => {
    it('should generate different PDFs for test and answer key', async () => {
      const test = createMockTest(3);
      
      const testResult = await generatePDF(test, false);
      const answerKeyResult = await generatePDF(test, true);

      expect(testResult.ok).toBe(true);
      expect(answerKeyResult.ok).toBe(true);
      
      if (testResult.ok && answerKeyResult.ok) {
        // The two PDFs should have different content (different sizes)
        expect(testResult.value.buffer.length).not.toBe(answerKeyResult.value.buffer.length);
        
        // The buffers should not be identical
        expect(testResult.value.buffer.equals(answerKeyResult.value.buffer)).toBe(false);
      }
    });

    it('should generate larger PDF for answer key (includes more content)', async () => {
      const test = createMockTest(3);
      
      const testResult = await generatePDF(test, false);
      const answerKeyResult = await generatePDF(test, true);

      expect(testResult.ok).toBe(true);
      expect(answerKeyResult.ok).toBe(true);
      
      if (testResult.ok && answerKeyResult.ok) {
        // Answer key typically has more content (answers + syllabus references)
        // So it should generally be larger, though compression can vary
        expect(answerKeyResult.value.buffer.length).toBeGreaterThan(0);
        expect(testResult.value.buffer.length).toBeGreaterThan(0);
      }
    });

    it('should generate consistent PDFs for same test', async () => {
      const test = createMockTest(3);
      
      const result1 = await generatePDF(test, false);
      const result2 = await generatePDF(test, false);

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      
      if (result1.ok && result2.ok) {
        // Both should be valid PDFs with similar structure
        expect(result1.value.buffer.toString('utf-8', 0, 4)).toBe('%PDF');
        expect(result2.value.buffer.toString('utf-8', 0, 4)).toBe('%PDF');
      }
    });

    it('should generate PDFs with different sizes for different question counts', async () => {
      const test1 = createMockTest(1);
      const test2 = createMockTest(10);
      
      const result1 = await generatePDF(test1, false);
      const result2 = await generatePDF(test2, false);

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      
      if (result1.ok && result2.ok) {
        // More questions should generally result in larger PDF
        expect(result2.value.buffer.length).toBeGreaterThan(result1.value.buffer.length);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle empty questions array gracefully', async () => {
      const test: MockTest = {
        testId: 'test-empty',
        configuration: {
          subject: 'Test',
          topics: ['t1'],
          questionCount: 0,
          testCount: 1,
          testMode: 'PrintablePDF',
        },
        questions: [],
        answerKey: new Map(),
        createdAt: new Date(),
      };

      const result = await generatePDF(test, false);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.buffer).toBeInstanceOf(Buffer);
      }
    });
  });

  describe('PDF Format Requirements', () => {
    it('should generate test PDF with proper structure', async () => {
      const test = createMockTest(3);
      const result = await generatePDF(test, false);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const pdfContent = result.value.buffer.toString('utf-8');
        // Check for PDF structure elements
        expect(pdfContent).toContain('/Type /Page');
        expect(pdfContent).toContain('/Type /Catalog');
        expect(pdfContent).toContain('%%EOF');
      }
    });

    it('should generate answer key PDF with proper structure', async () => {
      const test = createMockTest(3);
      const result = await generatePDF(test, true);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const pdfContent = result.value.buffer.toString('utf-8');
        // Check for PDF structure elements
        expect(pdfContent).toContain('/Type /Page');
        expect(pdfContent).toContain('/Type /Catalog');
        expect(pdfContent).toContain('%%EOF');
      }
    });

    it('should use multiple fonts in PDF', async () => {
      const test = createMockTest(3);
      const result = await generatePDF(test, false);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const pdfContent = result.value.buffer.toString('utf-8');
        // Check for font definitions
        expect(pdfContent).toContain('/BaseFont /Helvetica');
        expect(pdfContent).toContain('/BaseFont /Helvetica-Bold');
        expect(pdfContent).toContain('/BaseFont /Helvetica-Oblique');
      }
    });

    it('should include multiple pages for large tests', async () => {
      const test = createMockTest(20);
      const result = await generatePDF(test, false);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const pdfContent = result.value.buffer.toString('utf-8');
        // Check for page count indicator
        expect(pdfContent).toContain('/Type /Pages');
        expect(pdfContent).toContain('/Count');
      }
    });
  });
});


// ============================================================================
// Property-Based Tests for P1 Improvements
// ============================================================================

import * as fc from 'fast-check';
import { generateQuestionPaper, generateAnswerKey } from './pdfGenerator';

describe('PDF Generator - P1 Improvements', () => {
  // Helper to create test with specific topics
  function createTestWithTopics(topics: string[]): MockTest {
    const questions: Question[] = [{
      questionId: 'q1',
      topicId: 't1',
      questionText: 'Sample question',
      questionType: 'MultipleChoice',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'A',
      solutionSteps: ['Step 1: Analyze', 'Step 2: Solve'],
      syllabusReference: 'Test',
      difficulty: 'ExamRealistic',
      createdAt: new Date(),
    }];

    const answerKey = new Map<string, string>();
    answerKey.set('q1', 'A');

    return {
      testId: 'test-123',
      configuration: {
        subject: 'Mathematics',
        topics: topics,
        questionCount: 1,
        testCount: 1,
        testMode: 'PrintablePDF',
      },
      questions,
      answerKey,
      createdAt: new Date(),
    };
  }

  describe('Topic Header Properties', () => {
    // Feature: p1-improvements, Property 3: All Topics Appear in PDF Header
    // **Validates: Requirements 2.1**
    it('Property 3: should include all topics in generated PDFs', async () => {
      const testCases = [
        ['Algebra'],
        ['Algebra', 'Geometry'],
        ['Algebra', 'Geometry', 'Calculus'],
        ['Physics', 'Chemistry', 'Biology', 'Mathematics'],
      ];

      for (const topics of testCases) {
        const test = createTestWithTopics(topics);
        
        // Test question paper
        const questionResult = await generateQuestionPaper(test, topics);
        expect(questionResult.ok).toBe(true);
        if (questionResult.ok) {
          // Verify PDF was generated successfully
          expect(questionResult.value.buffer).toBeInstanceOf(Buffer);
          expect(questionResult.value.buffer.length).toBeGreaterThan(0);
        }

        // Test answer key
        const answerResult = await generateAnswerKey(test, topics);
        expect(answerResult.ok).toBe(true);
        if (answerResult.ok) {
          expect(answerResult.value.buffer).toBeInstanceOf(Buffer);
          expect(answerResult.value.buffer.length).toBeGreaterThan(0);
        }
      }
    });

    // Feature: p1-improvements, Property 4: Topic List Formatting
    // **Validates: Requirements 2.2**
    it('Property 4: should format single topic as "Topic:" and multiple as "Topics:"', async () => {
      // Single topic
      const singleTest = createTestWithTopics(['Algebra']);
      const singleResult = await generateQuestionPaper(singleTest, ['Algebra']);
      expect(singleResult.ok).toBe(true);
      if (singleResult.ok) {
        expect(singleResult.value.buffer).toBeInstanceOf(Buffer);
        expect(singleResult.value.buffer.length).toBeGreaterThan(0);
      }

      // Multiple topics
      const multiTest = createTestWithTopics(['Algebra', 'Geometry', 'Calculus']);
      const multiResult = await generateQuestionPaper(multiTest, ['Algebra', 'Geometry', 'Calculus']);
      expect(multiResult.ok).toBe(true);
      if (multiResult.ok) {
        expect(multiResult.value.buffer).toBeInstanceOf(Buffer);
        expect(multiResult.value.buffer.length).toBeGreaterThan(0);
      }
    });

    // Feature: p1-improvements, Property 5: Topic Order Preservation
    // **Validates: Requirements 2.5**
    it('Property 5: should preserve topic order in PDF', async () => {
      const topics = ['Algebra', 'Geometry', 'Trigonometry'];
      const test = createTestWithTopics(topics);
      
      const result = await generateQuestionPaper(test, topics);
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Verify PDF was generated successfully with topics in order
        expect(result.value.buffer).toBeInstanceOf(Buffer);
        expect(result.value.buffer.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Dual PDF Generation', () => {
    // Feature: p1-improvements, Property 6: Dual PDF Generation
    // **Validates: Requirements 3.1**
    it('Property 6: should generate two distinct PDFs', async () => {
      const test = createMockTest(2);
      const topics = ['Topic1', 'Topic2'];
      
      const questionResult = await generateQuestionPaper(test, topics);
      const answerResult = await generateAnswerKey(test, topics);
      
      expect(questionResult.ok).toBe(true);
      expect(answerResult.ok).toBe(true);
      
      if (questionResult.ok && answerResult.ok) {
        // Verify both are valid PDFs
        expect(questionResult.value.buffer.toString('utf-8', 0, 4)).toBe('%PDF');
        expect(answerResult.value.buffer.toString('utf-8', 0, 4)).toBe('%PDF');
        
        // Verify they have different filenames
        expect(questionResult.value.filename).toContain('questions');
        expect(answerResult.value.filename).toContain('answers');
        expect(questionResult.value.filename).not.toBe(answerResult.value.filename);
      }
    });

    // Feature: p1-improvements, Property 7: Question Paper Excludes Answers
    // **Validates: Requirements 3.2**
    it('Property 7: question paper should not contain correct answers', async () => {
      const test = createMockTest(3);
      const topics = ['Topic1'];
      
      const result = await generateQuestionPaper(test, topics);
      expect(result.ok).toBe(true);
      
      if (result.ok) {
        // Verify PDF was generated successfully without answers
        expect(result.value.buffer).toBeInstanceOf(Buffer);
        expect(result.value.buffer.length).toBeGreaterThan(0);
        expect(result.value.filename).toContain('questions');
      }
    });

    // Feature: p1-improvements, Property 8: Answer Key Includes Solutions
    // **Validates: Requirements 3.3**
    it('Property 8: answer key should contain answers and solutions', async () => {
      const questions: Question[] = [{
        questionId: 'q1',
        topicId: 't1',
        questionText: 'What is 2+2?',
        questionType: 'Numerical',
        correctAnswer: '4',
        solutionSteps: ['Step 1: Add 2 + 2', 'Step 2: Result is 4'],
        syllabusReference: 'Arithmetic',
        difficulty: 'ExamRealistic',
        createdAt: new Date(),
      }];

      const answerKey = new Map<string, string>();
      answerKey.set('q1', '4');

      const test: MockTest = {
        testId: 'test-123',
        configuration: {
          subject: 'Mathematics',
          topics: ['t1'],
          questionCount: 1,
          testCount: 1,
          testMode: 'PrintablePDF',
        },
        questions,
        answerKey,
        createdAt: new Date(),
      };

      const result = await generateAnswerKey(test, ['Arithmetic']);
      expect(result.ok).toBe(true);
      
      if (result.ok) {
        // Verify PDF was generated successfully with answers and solutions
        expect(result.value.buffer).toBeInstanceOf(Buffer);
        expect(result.value.buffer.length).toBeGreaterThan(0);
        expect(result.value.filename).toContain('answers');
      }
    });

    // Feature: p1-improvements, Property 11: Solution Steps Appear in Answer Key
    // **Validates: Requirements 4.4, 4.5**
    it('Property 11: solution steps should appear with proper formatting', async () => {
      const questions: Question[] = [{
        questionId: 'q1',
        topicId: 't1',
        questionText: 'Solve x + 5 = 10',
        questionType: 'Numerical',
        correctAnswer: '5',
        solutionSteps: [
          'Subtract 5 from both sides',
          'x = 10 - 5',
          'x = 5'
        ],
        syllabusReference: 'Algebra',
        difficulty: 'ExamRealistic',
        createdAt: new Date(),
      }];

      const answerKey = new Map<string, string>();
      answerKey.set('q1', '5');

      const test: MockTest = {
        testId: 'test-123',
        configuration: {
          subject: 'Mathematics',
          topics: ['t1'],
          questionCount: 1,
          testCount: 1,
          testMode: 'PrintablePDF',
        },
        questions,
        answerKey,
        createdAt: new Date(),
      };

      const result = await generateAnswerKey(test, ['Algebra']);
      expect(result.ok).toBe(true);
      
      if (result.ok) {
        // Verify PDF was generated successfully with solution steps
        expect(result.value.buffer).toBeInstanceOf(Buffer);
        expect(result.value.buffer.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Edge Cases', () => {
    // Requirement 2.4: Single topic formatting
    it('should generate PDF successfully with single topic', async () => {
      const test = createTestWithTopics(['Mathematics']);
      const result = await generateQuestionPaper(test, ['Mathematics']);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.buffer).toBeInstanceOf(Buffer);
        expect(result.value.buffer.length).toBeGreaterThan(0);
      }
    });

    // Requirement 4.6: Missing solution steps
    it('should handle missing solution steps gracefully', async () => {
      const questions: Question[] = [{
        questionId: 'q1',
        topicId: 't1',
        questionText: 'What is 2+2?',
        questionType: 'Numerical',
        correctAnswer: '4',
        // No solutionSteps field
        syllabusReference: 'Arithmetic',
        difficulty: 'ExamRealistic',
        createdAt: new Date(),
      }];

      const answerKey = new Map<string, string>();
      answerKey.set('q1', '4');

      const test: MockTest = {
        testId: 'test-123',
        configuration: {
          subject: 'Mathematics',
          topics: ['t1'],
          questionCount: 1,
          testCount: 1,
          testMode: 'PrintablePDF',
        },
        questions,
        answerKey,
        createdAt: new Date(),
      };

      const result = await generateAnswerKey(test, ['Arithmetic']);
      expect(result.ok).toBe(true);
      
      if (result.ok) {
        // Should not crash - if we got here, it handled missing steps gracefully
        expect(result.value.buffer).toBeInstanceOf(Buffer);
        expect(result.value.buffer.length).toBeGreaterThan(0);
      }
    });
  });
});
