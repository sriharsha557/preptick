// In-memory vector store with cosine similarity search

import { Question, QuestionId, TopicId, SyllabusContext } from '../types';

export interface VectorEntry {
  id: string;
  embedding: number[];
  metadata: {
    questionId?: QuestionId;
    topicId: TopicId;
    question?: Question;
    syllabusContext?: SyllabusContext;
  };
}

export interface SearchResult {
  entry: VectorEntry;
  similarity: number;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimension');
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * In-memory vector store for question embeddings
 */
export class InMemoryVectorStore {
  private entries: Map<string, VectorEntry> = new Map();

  /**
   * Add a vector entry to the store
   */
  async add(entry: VectorEntry): Promise<void> {
    this.entries.set(entry.id, entry);
  }

  /**
   * Add multiple vector entries to the store
   */
  async addBatch(entries: VectorEntry[]): Promise<void> {
    for (const entry of entries) {
      await this.add(entry);
    }
  }

  /**
   * Search for similar vectors
   */
  async search(
    queryEmbedding: number[],
    options: {
      topK?: number;
      minSimilarity?: number;
      filter?: (entry: VectorEntry) => boolean;
    } = {}
  ): Promise<SearchResult[]> {
    const { topK = 10, minSimilarity = 0, filter } = options;

    // Calculate similarity for all entries
    const results: SearchResult[] = [];
    
    for (const entry of this.entries.values()) {
      // Apply filter if provided
      if (filter && !filter(entry)) {
        continue;
      }

      const similarity = cosineSimilarity(queryEmbedding, entry.embedding);
      
      if (similarity >= minSimilarity) {
        results.push({ entry, similarity });
      }
    }

    // Sort by similarity (descending) and return top K
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, topK);
  }

  /**
   * Get entry by ID
   */
  async get(id: string): Promise<VectorEntry | undefined> {
    return this.entries.get(id);
  }

  /**
   * Delete entry by ID
   */
  async delete(id: string): Promise<boolean> {
    return this.entries.delete(id);
  }

  /**
   * Clear all entries
   */
  async clear(): Promise<void> {
    this.entries.clear();
  }

  /**
   * Get total number of entries
   */
  size(): number {
    return this.entries.size;
  }

  /**
   * Get all entries matching a filter
   */
  async filter(predicate: (entry: VectorEntry) => boolean): Promise<VectorEntry[]> {
    const results: VectorEntry[] = [];
    for (const entry of this.entries.values()) {
      if (predicate(entry)) {
        results.push(entry);
      }
    }
    return results;
  }

  /**
   * Get all entries for a specific topic
   */
  async getByTopic(topicId: TopicId): Promise<VectorEntry[]> {
    return this.filter(entry => entry.metadata.topicId === topicId);
  }

  /**
   * Get all entries for multiple topics
   */
  async getByTopics(topicIds: TopicId[]): Promise<VectorEntry[]> {
    const topicSet = new Set(topicIds);
    return this.filter(entry => topicSet.has(entry.metadata.topicId));
  }
}
