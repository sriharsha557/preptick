// LLM-based Question Generator implementation
// Uses GROQ API (OpenAI-compatible) for generating exam-realistic questions

import Groq from 'groq-sdk';
import {
  Question,
  QuestionId,
  SyllabusContext,
  AlignmentScore,
  Result,
  GenerationError,
  ValidationError,
  Ok,
  Err,
  QuestionType,
} from '../types';
import { QuestionGenerator } from './interfaces';

/**
 * Math subjects that require quantitative problem-solving
 * Requirement 6.1: Identify Math_Subject types
 */
const MATH_SUBJECTS = [
  'Mathematics',
  'Math',
  'Physics',
  'Chemistry',
  'Statistics',
  'Calculus',
  'Algebra',
  'Geometry',
  'Trigonometry',
  'Arithmetic',
];

/**
 * Check if a subject is a math subject requiring quantitative problems
 * Requirement 6.1: Math Subject Identification
 */
export function isMathSubject(subject: string): boolean {
  const subjectLower = subject.toLowerCase();
  return MATH_SUBJECTS.some(mathSubj => 
    subjectLower.includes(mathSubj.toLowerCase())
  );
}

export class LLMQuestionGeneratorService implements QuestionGenerator {
  private groq: Groq;

  constructor(apiKey: string) {
    this.groq = new Groq({
      apiKey,
    });
  }

  /**
   * Generate questions using LLM with syllabus context as grounding
   * Requirement 4.3: Ensure exam-realistic difficulty without user selection
   * This is used as a fallback when RAG retrieval is insufficient
   */
  async generateQuestions(
    syllabusContext: SyllabusContext,
    count: number,
    existingQuestions: Question[],
    subject?: string,
    testMode?: 'InAppExam' | 'PDFDownload'
  ): Promise<Result<Question[], GenerationError>> {
    try {
      // Build prompt with syllabus context and existing questions to avoid duplication
      const prompt = this.buildGenerationPrompt(
        syllabusContext,
        count,
        existingQuestions,
        subject,
        testMode
      );

      // Call GROQ API with lower temperature for more accurate answers
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(testMode),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.4, // Lower temperature for more accurate, consistent answers
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        return Err({
          type: 'GenerationFailed',
          message: 'No response from LLM',
        });
      }

      // Parse the JSON response
      const parsedResponse = JSON.parse(responseContent);
      
      if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
        return Err({
          type: 'GenerationFailed',
          message: 'Invalid response format from LLM',
        });
      }

      // Convert LLM response to Question objects
      // Requirement 4.2, 4.3: Parse solution steps from LLM response
      const questions: Question[] = parsedResponse.questions.map(
        (q: any, index: number) => ({
          questionId: `llm-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 11)}`,
          topicId: syllabusContext.topicId,
          questionText: q.questionText,
          questionType: q.questionType as QuestionType,
          options: q.options,
          correctAnswer: q.correctAnswer,
          solutionSteps: Array.isArray(q.solutionSteps) ? q.solutionSteps : [], // Parse and validate solution steps
          syllabusReference: q.syllabusReference || syllabusContext.content.substring(0, 50),
          difficulty: 'ExamRealistic',
          createdAt: new Date(),
        })
      );

      // Validate that we got the requested number of questions
      if (questions.length < count) {
        return Err({
          type: 'GenerationFailed',
          message: `LLM generated ${questions.length} questions, but ${count} were requested`,
        });
      }

      return Ok(questions.slice(0, count));
    } catch (error) {
      return Err({
        type: 'GenerationFailed',
        message: error instanceof Error ? error.message : 'Unknown error during LLM generation',
      });
    }
  }

  /**
   * Validate that a generated question aligns with the syllabus context
   * Requirement 4.2: Ensure questions match syllabus content
   */
  async validateSyllabusAlignment(
    question: Question,
    syllabusContext: SyllabusContext
  ): Promise<Result<AlignmentScore, ValidationError>> {
    try {
      const prompt = this.buildValidationPrompt(question, syllabusContext);

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational content validator. Assess whether questions align with syllabus content.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        return Err({
          type: 'ValidationError',
          field: 'alignment',
          message: 'No response from LLM during validation',
        });
      }

      const parsedResponse = JSON.parse(responseContent);

      const alignmentScore: AlignmentScore = {
        score: parsedResponse.score || 0,
        reasoning: parsedResponse.reasoning || 'No reasoning provided',
        syllabusReferences: parsedResponse.syllabusReferences || [],
      };

      return Ok(alignmentScore);
    } catch (error) {
      return Err({
        type: 'ValidationError',
        field: 'alignment',
        message: error instanceof Error ? error.message : 'Unknown validation error',
      });
    }
  }

  /**
   * Build the system prompt for question generation
   * @param testMode - If 'InAppExam', only generate MultipleChoice questions
   */
  private getSystemPrompt(testMode?: 'InAppExam' | 'PDFDownload'): string {
    const isOnlineExam = testMode === 'InAppExam';

    const questionTypesSection = isOnlineExam
      ? `Question Types (ONLINE EXAM MODE - ONLY MultipleChoice allowed):
- MultipleChoice: Include 4 options with EXACTLY ONE correct answer
- Do NOT generate ShortAnswer or Numerical questions for online exams
- All questions MUST be MultipleChoice with clear, distinct options`
      : `Question Types:
- MultipleChoice: Include 4 options with exactly one correct answer
- ShortAnswer: Require a brief written response (1-3 sentences)
- Numerical: Require a numerical answer (with units if applicable)`;

    return `You are an expert educational content creator specializing in creating exam-realistic questions for CBSE and Cambridge curricula (grades 1-10).

CRITICAL ACCURACY REQUIREMENTS:
- You MUST verify that every correct answer is 100% accurate before including it
- Double-check all mathematical calculations, formulas, and solutions
- For multiple choice, ensure the correct option is unambiguously right and distractors are clearly wrong but plausible
- If you are not certain about an answer, do not include that question
- Students and parents trust these questions - accuracy is paramount

Your task is to generate high-quality, exam-realistic questions that:
1. Strictly align with the provided syllabus content
2. Match the difficulty level of actual exams (no easier or harder)
3. Are clear, unambiguous, and age-appropriate
4. Follow standard exam question formats
5. Include VERIFIED, accurate correct answers - double-check every answer
6. Include detailed step-by-step solution explanations
7. Do NOT duplicate or closely resemble existing questions

${questionTypesSection}

Response Format:
Return a JSON object with a "questions" array. Each question must have:
{
  "questions": [
    {
      "questionText": "The complete question text",
      "questionType": "${isOnlineExam ? 'MultipleChoice' : 'MultipleChoice" | "ShortAnswer" | "Numerical'}",
      "options": ["option1", "option2", "option3", "option4"], // ${isOnlineExam ? 'REQUIRED for all questions' : 'only for MultipleChoice'}
      "correctAnswer": "The correct answer (must match one option exactly for MultipleChoice)",
      "syllabusReference": "Specific syllabus section or concept",
      "solutionSteps": [
        "Step 1: Clear explanation of the first step",
        "Step 2: Explanation of the next step with reasoning",
        "Step 3: Final answer with complete justification"
      ]
    }
  ]
}`;
  }

  /**
   * Build the prompt for question generation
   * Requirements: 4.2, 4.3, 6.2, 6.5
   */
  private buildGenerationPrompt(
    syllabusContext: SyllabusContext,
    count: number,
    existingQuestions: Question[],
    subject?: string,
    testMode?: 'InAppExam' | 'PDFDownload'
  ): string {
    // Extract topic name from content (format: "Topic Name: content...")
    const topicName = syllabusContext.content.split(':')[0].trim();
    const isOnlineExam = testMode === 'InAppExam';

    let prompt = `Generate ${count} exam-realistic questions based on the following syllabus content:\n\n`;

    prompt += `Topic: ${topicName}\n`;
    prompt += `Syllabus Content: ${syllabusContext.content}\n\n`;

    if (syllabusContext.relatedConcepts.length > 0) {
      prompt += `Key Concepts:\n`;
      syllabusContext.relatedConcepts.forEach(concept => {
        prompt += `- ${concept}\n`;
      });
      prompt += '\n';
    }

    // Add online exam mode constraint - only MultipleChoice questions
    if (isOnlineExam) {
      prompt += `CRITICAL - ONLINE EXAM MODE:
- Generate ONLY MultipleChoice questions (no ShortAnswer or Numerical)
- Each question MUST have exactly 4 options (A, B, C, D)
- The correctAnswer MUST match one of the options exactly
- Make options distinct but plausible (avoid obviously wrong options)

`;
    }

    // Add math-specific constraints if this is a math subject
    // Requirement 6.2: Use prompts that request numerical and calculation-based problems
    if (subject && isMathSubject(subject)) {
      prompt += `IMPORTANT - MATH SUBJECT REQUIREMENTS:
- Generate ONLY quantitative, numerical, or calculation-based problems
- Do NOT generate explanatory, theoretical, or definition-based questions
- Each question MUST require mathematical computation or problem-solving
- Focus on applying formulas, solving equations, or performing calculations
- Include numerical values in options/answers
- VERIFY all calculations are correct before including

`;
    }

    // Add existing questions to avoid duplication
    if (existingQuestions.length > 0) {
      prompt += `IMPORTANT: Do NOT create questions similar to these existing questions:\n`;
      existingQuestions.slice(0, 5).forEach((q, index) => {
        prompt += `${index + 1}. ${q.questionText}\n`;
      });
      prompt += '\n';
    }

    const questionTypeRequirement = isOnlineExam
      ? '- Generate ONLY MultipleChoice questions (this is mandatory for online exams)'
      : '- Mix question types (MultipleChoice, ShortAnswer, Numerical) appropriately for the topic';

    prompt += `Requirements:
- Generate exactly ${count} questions
${questionTypeRequirement}
- Ensure all questions are exam-realistic in difficulty
- Each question must test understanding of the syllabus content
- VERIFY all correct answers are 100% accurate - double-check calculations
- Include detailed step-by-step solution explanations in the solutionSteps array
- Each solution step should be clear, logical, and educational
- Include specific syllabus references

Return the questions in the specified JSON format with solutionSteps included.`;

    return prompt;
  }

  /**
   * Build the prompt for syllabus alignment validation
   */
  private buildValidationPrompt(
    question: Question,
    syllabusContext: SyllabusContext
  ): string {
    return `Validate whether this question aligns with the syllabus content:

Question:
${question.questionText}

Question Type: ${question.questionType}
${question.options ? `Options: ${question.options.join(', ')}` : ''}
Correct Answer: ${question.correctAnswer}

Syllabus Content:
${syllabusContext.content}

Key Concepts:
${syllabusContext.relatedConcepts.join(', ')}

Assess the alignment and provide:
1. A score from 0 to 1 (0 = no alignment, 1 = perfect alignment)
2. Reasoning for the score
3. Specific syllabus references that the question addresses

Return a JSON object with this format:
{
  "score": 0.95,
  "reasoning": "The question directly tests...",
  "syllabusReferences": ["concept1", "concept2"]
}`;
  }
}
