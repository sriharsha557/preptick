// Embedding service using GROQ API for generating embeddings

import { Question, SyllabusContext, TopicId } from '../types';

export interface EmbeddingService {
  /**
   * Generate embedding for a question
   */
  generateQuestionEmbedding(question: Question): Promise<number[]>;
  
  /**
   * Generate embedding for syllabus context
   */
  generateSyllabusEmbedding(context: SyllabusContext): Promise<number[]>;
  
  /**
   * Generate embedding for a text query
   */
  generateTextEmbedding(text: string): Promise<number[]>;
}

/**
 * GROQ-based embedding service
 * Uses GROQ API for generating embeddings
 */
export class GroqEmbeddingService implements EmbeddingService {
  private apiKey: string;
  private apiUrl = 'https://api.groq.com/openai/v1/embeddings';
  private model = 'text-embedding-ada-002'; // Using OpenAI-compatible endpoint

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateQuestionEmbedding(question: Question): Promise<number[]> {
    // Combine question text with context for better embeddings
    const text = `${question.questionText} ${question.syllabusReference}`;
    return this.generateTextEmbedding(text);
  }

  async generateSyllabusEmbedding(context: SyllabusContext): Promise<number[]> {
    // Combine all context information
    const text = `${context.content} ${context.relatedConcepts.join(' ')}`;
    return this.generateTextEmbedding(text);
  }

  async generateTextEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          input: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`GROQ API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Simple embedding service for testing/development
 * Generates deterministic embeddings based on text hash
 */
export class SimpleEmbeddingService implements EmbeddingService {
  private embeddingDimension = 384; // Common embedding dimension

  async generateQuestionEmbedding(question: Question): Promise<number[]> {
    const text = `${question.questionText} ${question.syllabusReference}`;
    return this.generateTextEmbedding(text);
  }

  async generateSyllabusEmbedding(context: SyllabusContext): Promise<number[]> {
    const text = `${context.content} ${context.relatedConcepts.join(' ')}`;
    return this.generateTextEmbedding(text);
  }

  async generateTextEmbedding(text: string): Promise<number[]> {
    // Generate a deterministic embedding based on text hash
    const embedding = new Array(this.embeddingDimension).fill(0);
    
    // Simple hash-based embedding generation
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const index = (charCode * (i + 1)) % this.embeddingDimension;
      embedding[index] += charCode / 1000;
    }
    
    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
  }
}
