// LLM Question Generator tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMQuestionGeneratorService } from './llmQuestionGenerator';
import { SyllabusContext, Question } from '../types';

// Mock the Groq SDK
vi.mock('groq-sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    })),
  };
});

describe('LLMQuestionGeneratorService', () => {
  let questionGenerator: LLMQuestionGeneratorService;
  let mockGroqCreate: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create service instance
    questionGenerator = new LLMQuestionGeneratorService('test-api-key');
    
    // Get reference to the mocked create method
    mockGroqCreate = (questionGenerator as any).groq.chat.completions.create;
  });

  describe('generateQuestions', () => {
    const syllabusContext: SyllabusContext = {
      topicId: 'topic-math-addition',
      content: 'Addition: Basic arithmetic operation of combining two or more numbers',
      relatedConcepts: ['Single-digit addition', 'Two-digit addition', 'Carrying'],
    };

    it('should generate the requested number of questions', async () => {
      // Mock LLM response
      mockGroqCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                questions: [
                  {
                    questionText: 'What is 5 + 3?',
                    questionType: 'MultipleChoice',
                    options: ['6', '7', '8', '9'],
                    correctAnswer: '8',
                    syllabusReference: 'Single-digit addition',
                  },
                  {
                    questionText: 'Calculate 12 + 15',
                    questionType: 'Numerical',
                    correctAnswer: '27',
                    syllabusReference: 'Two-digit addition',
                  },
                  {
                    questionText: 'Explain the concept of carrying in addition',
                    questionType: 'ShortAnswer',
                    correctAnswer: 'Carrying is when the sum of digits exceeds 9 and we move the extra value to the next column',
                    syllabusReference: 'Carrying',
                  },
                ],
              }),
            },
          },
        ],
      });

      const result = await questionGenerator.generateQuestions(
        syllabusContext,
        3,
        []
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(3);
        
        // Verify question structure
        result.value.forEach(question => {
          expect(question.questionId).toBeDefined();
          expect(question.topicId).toBe('topic-math-addition');
          expect(question.questionText).toBeDefined();
          expect(question.questionType).toBeDefined();
          expect(question.correctAnswer).toBeDefined();
          expect(question.difficulty).toBe('ExamRealistic');
          expect(question.createdAt).toBeInstanceOf(Date);
        });
      }
    });

    it('should use syllabus context as grounding for question generation', async () => {
      mockGroqCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                questions: [
                  {
                    questionText: 'What is 2 + 2?',
                    questionType: 'MultipleChoice',
                    options: ['2', '3', '4', '5'],
                    correctAnswer: '4',
                    syllabusReference: 'Single-digit addition',
                  },
                ],
              }),
            },
          },
        ],
      });

      await questionGenerator.generateQuestions(syllabusContext, 1, []);

      // Verify the prompt includes syllabus context
      expect(mockGroqCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining('Addition: Basic arithmetic operation'),
            }),
          ]),
        })
      );
    });

    it('should ensure exam-realistic difficulty without user selection', async () => {
      mockGroqCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                questions: [
                  {
                    questionText: 'What is 7 + 8?',
                    questionType: 'MultipleChoice',
                    options: ['13', '14', '15', '16'],
                    correctAnswer: '15',
                    syllabusReference: 'Single-digit addition',
                  },
                ],
              }),
            },
          },
        ],
      });

      const result = await questionGenerator.generateQuestions(
        syllabusContext,
        1,
        []
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        // All generated questions should have ExamRealistic difficulty
        expect(result.value[0].difficulty).toBe('ExamRealistic');
      }

      // Verify the system prompt mentions exam-realistic difficulty
      expect(mockGroqCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('exam-realistic'),
            }),
          ]),
        })
      );
    });

    it('should avoid duplicating existing questions', async () => {
      const existingQuestions: Question[] = [
        {
          questionId: 'q1',
          topicId: 'topic-math-addition',
          questionText: 'What is 5 + 3?',
          questionType: 'MultipleChoice',
          options: ['6', '7', '8', '9'],
          correctAnswer: '8',
          syllabusReference: 'Single-digit addition',
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        },
      ];

      mockGroqCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                questions: [
                  {
                    questionText: 'Calculate 9 + 6',
                    questionType: 'Numerical',
                    correctAnswer: '15',
                    syllabusReference: 'Single-digit addition',
                  },
                ],
              }),
            },
          },
        ],
      });

      await questionGenerator.generateQuestions(
        syllabusContext,
        1,
        existingQuestions
      );

      // Verify the prompt includes existing questions to avoid duplication
      expect(mockGroqCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining('What is 5 + 3?'),
            }),
          ]),
        })
      );
    });

    it('should handle different question types correctly', async () => {
      mockGroqCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                questions: [
                  {
                    questionText: 'What is 10 + 5?',
                    questionType: 'MultipleChoice',
                    options: ['13', '14', '15', '16'],
                    correctAnswer: '15',
                    syllabusReference: 'Two-digit addition',
                  },
                  {
                    questionText: 'Calculate 25 + 37',
                    questionType: 'Numerical',
                    correctAnswer: '62',
                    syllabusReference: 'Two-digit addition with carrying',
                  },
                  {
                    questionText: 'Describe the steps to add 48 + 27',
                    questionType: 'ShortAnswer',
                    correctAnswer: 'Add ones place (8+7=15, write 5 carry 1), then tens place (4+2+1=7), result is 75',
                    syllabusReference: 'Two-digit addition with carrying',
                  },
                ],
              }),
            },
          },
        ],
      });

      const result = await questionGenerator.generateQuestions(
        syllabusContext,
        3,
        []
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Verify MultipleChoice has options
        const mcQuestion = result.value.find(q => q.questionType === 'MultipleChoice');
        expect(mcQuestion?.options).toBeDefined();
        expect(mcQuestion?.options).toHaveLength(4);

        // Verify Numerical doesn't have options
        const numQuestion = result.value.find(q => q.questionType === 'Numerical');
        expect(numQuestion?.options).toBeUndefined();

        // Verify ShortAnswer doesn't have options
        const saQuestion = result.value.find(q => q.questionType === 'ShortAnswer');
        expect(saQuestion?.options).toBeUndefined();
      }
    });

    it('should include syllabus references in generated questions', async () => {
      mockGroqCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                questions: [
                  {
                    questionText: 'What is 4 + 6?',
                    questionType: 'MultipleChoice',
                    options: ['8', '9', '10', '11'],
                    correctAnswer: '10',
                    syllabusReference: 'Single-digit addition',
                  },
                ],
              }),
            },
          },
        ],
      });

      const result = await questionGenerator.generateQuestions(
        syllabusContext,
        1,
        []
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].syllabusReference).toBeDefined();
        expect(result.value[0].syllabusReference).toBeTruthy();
      }
    });

    it('should handle LLM API errors gracefully', async () => {
      mockGroqCreate.mockRejectedValue(new Error('API rate limit exceeded'));

      const result = await questionGenerator.generateQuestions(
        syllabusContext,
        1,
        []
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('GenerationFailed');
        expect(result.error.message).toContain('API rate limit exceeded');
      }
    });

    it('should handle empty LLM response', async () => {
      mockGroqCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      });

      const result = await questionGenerator.generateQuestions(
        syllabusContext,
        1,
        []
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('GenerationFailed');
        expect(result.error.message).toContain('No response from LLM');
      }
    });

    it('should handle invalid JSON response', async () => {
      mockGroqCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'This is not valid JSON',
            },
          },
        ],
      });

      const result = await questionGenerator.generateQuestions(
        syllabusContext,
        1,
        []
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('GenerationFailed');
      }
    });

    it('should handle malformed response structure', async () => {
      mockGroqCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                // Missing 'questions' array
                data: 'some data',
              }),
            },
          },
        ],
      });

      const result = await questionGenerator.generateQuestions(
        syllabusContext,
        1,
        []
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('GenerationFailed');
        expect(result.error.message).toContain('Invalid response format');
      }
    });

    it('should handle insufficient questions generated', async () => {
      mockGroqCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                questions: [
                  {
                    questionText: 'What is 1 + 1?',
                    questionType: 'MultipleChoice',
                    options: ['1', '2', '3', '4'],
                    correctAnswer: '2',
                    syllabusReference: 'Single-digit addition',
                  },
                ],
              }),
            },
          },
        ],
      });

      const result = await questionGenerator.generateQuestions(
        syllabusContext,
        5, // Request 5 but only 1 generated
        []
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('GenerationFailed');
        expect(result.error.message).toContain('generated 1 questions');
        expect(result.error.message).toContain('5 were requested');
      }
    });

    it('should use appropriate LLM model and parameters', async () => {
      mockGroqCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                questions: [
                  {
                    questionText: 'What is 3 + 4?',
                    questionType: 'MultipleChoice',
                    options: ['5', '6', '7', '8'],
                    correctAnswer: '7',
                    syllabusReference: 'Single-digit addition',
                  },
                ],
              }),
            },
          },
        ],
      });

      await questionGenerator.generateQuestions(syllabusContext, 1, []);

      expect(mockGroqCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'llama-3.3-70b-versatile',
          temperature: 0.7,
          max_tokens: 4000,
          response_format: { type: 'json_object' },
        })
      );
    });
  });

  describe('validateSyllabusAlignment', () => {
    const syllabusContext: SyllabusContext = {
      topicId: 'topic-math-addition',
      content: 'Addition: Basic arithmetic operation of combining two or more numbers',
      relatedConcepts: ['Single-digit addition', 'Two-digit addition', 'Carrying'],
    };

    const question: Question = {
      questionId: 'q1',
      topicId: 'topic-math-addition',
      questionText: 'What is 5 + 3?',
      questionType: 'MultipleChoice',
      options: ['6', '7', '8', '9'],
      correctAnswer: '8',
      syllabusReference: 'Single-digit addition',
      difficulty: 'ExamRealistic',
      createdAt: new Date(),
    };

    it('should validate question alignment with syllabus', async () => {
      mockGroqCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                score: 0.95,
                reasoning: 'The question directly tests single-digit addition which is a core concept in the syllabus',
                syllabusReferences: ['Single-digit addition', 'Basic arithmetic'],
              }),
            },
          },
        ],
      });

      const result = await questionGenerator.validateSyllabusAlignment(
        question,
        syllabusContext
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.score).toBe(0.95);
        expect(result.value.reasoning).toBeDefined();
        expect(result.value.syllabusReferences).toHaveLength(2);
      }
    });

    it('should include question and syllabus content in validation prompt', async () => {
      mockGroqCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                score: 0.9,
                reasoning: 'Good alignment',
                syllabusReferences: ['Addition'],
              }),
            },
          },
        ],
      });

      await questionGenerator.validateSyllabusAlignment(question, syllabusContext);

      expect(mockGroqCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining('What is 5 + 3?'),
            }),
          ]),
        })
      );

      expect(mockGroqCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining('Addition: Basic arithmetic operation'),
            }),
          ]),
        })
      );
    });

    it('should handle validation errors gracefully', async () => {
      mockGroqCreate.mockRejectedValue(new Error('Validation service unavailable'));

      const result = await questionGenerator.validateSyllabusAlignment(
        question,
        syllabusContext
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('ValidationError');
        expect(result.error.message).toContain('Validation service unavailable');
      }
    });

    it('should handle empty validation response', async () => {
      mockGroqCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      });

      const result = await questionGenerator.validateSyllabusAlignment(
        question,
        syllabusContext
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('ValidationError');
        expect(result.error.message).toContain('No response from LLM');
      }
    });

    it('should use lower temperature for validation', async () => {
      mockGroqCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                score: 0.85,
                reasoning: 'Aligned',
                syllabusReferences: ['Addition'],
              }),
            },
          },
        ],
      });

      await questionGenerator.validateSyllabusAlignment(question, syllabusContext);

      expect(mockGroqCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.3, // Lower temperature for more consistent validation
        })
      );
    });
  });
});
