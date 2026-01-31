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
    existingQuestions: Question[]
  ): Promise<Result<Question[], GenerationError>> {
    try {
      // Build prompt with syllabus context and existing questions to avoid duplication
      const prompt = this.buildGenerationPrompt(
        syllabusContext,
        count,
        existingQuestions
      );

      // Call GROQ API
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
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
      const questions: Question[] = parsedResponse.questions.map(
        (q: any, index: number) => ({
          questionId: `llm-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 11)}`,
          topicId: syllabusContext.topicId,
          questionText: q.questionText,
          questionType: q.questionType as QuestionType,
          options: q.options,
          correctAnswer: q.correctAnswer,
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
   */
  private getSystemPrompt(): string {
    return `You are an expert educational content creator specializing in creating exam-realistic questions for CBSE and Cambridge curricula (grades 1-10).

Your task is to generate high-quality, exam-realistic questions that:
1. Strictly align with the provided syllabus content
2. Match the difficulty level of actual exams (no easier or harder)
3. Are clear, unambiguous, and age-appropriate
4. Follow standard exam question formats
5. Include accurate and verifiable correct answers
6. Do NOT duplicate or closely resemble existing questions

Question Types:
- MultipleChoice: Include 4 options with exactly one correct answer
- ShortAnswer: Require a brief written response (1-3 sentences)
- Numerical: Require a numerical answer (with units if applicable)

Response Format:
Return a JSON object with a "questions" array. Each question must have:
{
  "questions": [
    {
      "questionText": "The complete question text",
      "questionType": "MultipleChoice" | "ShortAnswer" | "Numerical",
      "options": ["option1", "option2", "option3", "option4"], // only for MultipleChoice
      "correctAnswer": "The correct answer",
      "syllabusReference": "Specific syllabus section or concept"
    }
  ]
}`;
  }

  /**
   * Build the prompt for question generation
   */
  private buildGenerationPrompt(
    syllabusContext: SyllabusContext,
    count: number,
    existingQuestions: Question[]
  ): string {
    let prompt = `Generate ${count} exam-realistic questions based on the following syllabus content:\n\n`;
    
    prompt += `Topic: ${syllabusContext.topicId}\n`;
    prompt += `Content: ${syllabusContext.content}\n\n`;
    
    if (syllabusContext.relatedConcepts.length > 0) {
      prompt += `Key Concepts:\n`;
      syllabusContext.relatedConcepts.forEach(concept => {
        prompt += `- ${concept}\n`;
      });
      prompt += '\n';
    }

    // Add existing questions to avoid duplication
    if (existingQuestions.length > 0) {
      prompt += `IMPORTANT: Do NOT create questions similar to these existing questions:\n`;
      existingQuestions.slice(0, 5).forEach((q, index) => {
        prompt += `${index + 1}. ${q.questionText}\n`;
      });
      prompt += '\n';
    }

    prompt += `Requirements:
- Generate exactly ${count} questions
- Mix question types (MultipleChoice, ShortAnswer, Numerical) appropriately for the topic
- Ensure all questions are exam-realistic in difficulty
- Each question must test understanding of the syllabus content
- Provide accurate correct answers
- Include specific syllabus references

Return the questions in the specified JSON format.`;

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
