// Unit tests for vector store

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryVectorStore, cosineSimilarity, VectorEntry } from './vectorStore';

describe('cosineSimilarity', () => {
  it('should return 1 for identical vectors', () => {
    const v1 = [1, 2, 3];
    const v2 = [1, 2, 3];
    expect(cosineSimilarity(v1, v2)).toBeCloseTo(1, 5);
  });

  it('should return 0 for orthogonal vectors', () => {
    const v1 = [1, 0, 0];
    const v2 = [0, 1, 0];
    expect(cosineSimilarity(v1, v2)).toBeCloseTo(0, 5);
  });

  it('should return -1 for opposite vectors', () => {
    const v1 = [1, 2, 3];
    const v2 = [-1, -2, -3];
    expect(cosineSimilarity(v1, v2)).toBeCloseTo(-1, 5);
  });

  it('should handle zero vectors', () => {
    const v1 = [0, 0, 0];
    const v2 = [1, 2, 3];
    expect(cosineSimilarity(v1, v2)).toBe(0);
  });

  it('should throw error for vectors of different dimensions', () => {
    const v1 = [1, 2, 3];
    const v2 = [1, 2];
    expect(() => cosineSimilarity(v1, v2)).toThrow('Vectors must have the same dimension');
  });
});

describe('InMemoryVectorStore', () => {
  let store: InMemoryVectorStore;

  beforeEach(() => {
    store = new InMemoryVectorStore();
  });

  describe('add and get', () => {
    it('should add and retrieve a vector entry', async () => {
      const entry: VectorEntry = {
        id: 'q1',
        embedding: [1, 0, 0],
        metadata: {
          questionId: 'q1',
          topicId: 't1',
        },
      };

      await store.add(entry);
      const retrieved = await store.get('q1');

      expect(retrieved).toEqual(entry);
    });

    it('should return undefined for non-existent entry', async () => {
      const retrieved = await store.get('non-existent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('addBatch', () => {
    it('should add multiple entries at once', async () => {
      const entries: VectorEntry[] = [
        {
          id: 'q1',
          embedding: [1, 0, 0],
          metadata: { questionId: 'q1', topicId: 't1' },
        },
        {
          id: 'q2',
          embedding: [0, 1, 0],
          metadata: { questionId: 'q2', topicId: 't1' },
        },
      ];

      await store.addBatch(entries);

      expect(store.size()).toBe(2);
      expect(await store.get('q1')).toEqual(entries[0]);
      expect(await store.get('q2')).toEqual(entries[1]);
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      const entries: VectorEntry[] = [
        {
          id: 'q1',
          embedding: [1, 0, 0],
          metadata: { questionId: 'q1', topicId: 't1' },
        },
        {
          id: 'q2',
          embedding: [0.9, 0.1, 0],
          metadata: { questionId: 'q2', topicId: 't1' },
        },
        {
          id: 'q3',
          embedding: [0, 1, 0],
          metadata: { questionId: 'q3', topicId: 't2' },
        },
        {
          id: 'q4',
          embedding: [0, 0, 1],
          metadata: { questionId: 'q4', topicId: 't2' },
        },
      ];

      await store.addBatch(entries);
    });

    it('should find most similar vectors', async () => {
      const query = [1, 0, 0];
      const results = await store.search(query, { topK: 2 });

      expect(results).toHaveLength(2);
      expect(results[0].entry.id).toBe('q1');
      expect(results[0].similarity).toBeCloseTo(1, 5);
      expect(results[1].entry.id).toBe('q2');
    });

    it('should respect topK parameter', async () => {
      const query = [1, 0, 0];
      const results = await store.search(query, { topK: 1 });

      expect(results).toHaveLength(1);
      expect(results[0].entry.id).toBe('q1');
    });

    it('should filter by minimum similarity', async () => {
      const query = [1, 0, 0];
      const results = await store.search(query, { minSimilarity: 0.9 });

      expect(results.length).toBeLessThanOrEqual(2);
      results.forEach(result => {
        expect(result.similarity).toBeGreaterThanOrEqual(0.9);
      });
    });

    it('should apply custom filter', async () => {
      const query = [1, 0, 0];
      const results = await store.search(query, {
        topK: 10,
        filter: (entry) => entry.metadata.topicId === 't2',
      });

      expect(results.every(r => r.entry.metadata.topicId === 't2')).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete an entry', async () => {
      const entry: VectorEntry = {
        id: 'q1',
        embedding: [1, 0, 0],
        metadata: { questionId: 'q1', topicId: 't1' },
      };

      await store.add(entry);
      expect(store.size()).toBe(1);

      const deleted = await store.delete('q1');
      expect(deleted).toBe(true);
      expect(store.size()).toBe(0);
      expect(await store.get('q1')).toBeUndefined();
    });

    it('should return false when deleting non-existent entry', async () => {
      const deleted = await store.delete('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all entries', async () => {
      const entries: VectorEntry[] = [
        {
          id: 'q1',
          embedding: [1, 0, 0],
          metadata: { questionId: 'q1', topicId: 't1' },
        },
        {
          id: 'q2',
          embedding: [0, 1, 0],
          metadata: { questionId: 'q2', topicId: 't1' },
        },
      ];

      await store.addBatch(entries);
      expect(store.size()).toBe(2);

      await store.clear();
      expect(store.size()).toBe(0);
    });
  });

  describe('filter', () => {
    beforeEach(async () => {
      const entries: VectorEntry[] = [
        {
          id: 'q1',
          embedding: [1, 0, 0],
          metadata: { questionId: 'q1', topicId: 't1' },
        },
        {
          id: 'q2',
          embedding: [0, 1, 0],
          metadata: { questionId: 'q2', topicId: 't1' },
        },
        {
          id: 'q3',
          embedding: [0, 0, 1],
          metadata: { questionId: 'q3', topicId: 't2' },
        },
      ];

      await store.addBatch(entries);
    });

    it('should filter entries by predicate', async () => {
      const results = await store.filter(entry => entry.metadata.topicId === 't1');

      expect(results).toHaveLength(2);
      expect(results.every(r => r.metadata.topicId === 't1')).toBe(true);
    });
  });

  describe('getByTopic', () => {
    beforeEach(async () => {
      const entries: VectorEntry[] = [
        {
          id: 'q1',
          embedding: [1, 0, 0],
          metadata: { questionId: 'q1', topicId: 't1' },
        },
        {
          id: 'q2',
          embedding: [0, 1, 0],
          metadata: { questionId: 'q2', topicId: 't1' },
        },
        {
          id: 'q3',
          embedding: [0, 0, 1],
          metadata: { questionId: 'q3', topicId: 't2' },
        },
      ];

      await store.addBatch(entries);
    });

    it('should get all entries for a topic', async () => {
      const results = await store.getByTopic('t1');

      expect(results).toHaveLength(2);
      expect(results.every(r => r.metadata.topicId === 't1')).toBe(true);
    });

    it('should return empty array for non-existent topic', async () => {
      const results = await store.getByTopic('non-existent');
      expect(results).toHaveLength(0);
    });
  });

  describe('getByTopics', () => {
    beforeEach(async () => {
      const entries: VectorEntry[] = [
        {
          id: 'q1',
          embedding: [1, 0, 0],
          metadata: { questionId: 'q1', topicId: 't1' },
        },
        {
          id: 'q2',
          embedding: [0, 1, 0],
          metadata: { questionId: 'q2', topicId: 't2' },
        },
        {
          id: 'q3',
          embedding: [0, 0, 1],
          metadata: { questionId: 'q3', topicId: 't3' },
        },
      ];

      await store.addBatch(entries);
    });

    it('should get entries for multiple topics', async () => {
      const results = await store.getByTopics(['t1', 't2']);

      expect(results).toHaveLength(2);
      expect(results.some(r => r.metadata.topicId === 't1')).toBe(true);
      expect(results.some(r => r.metadata.topicId === 't2')).toBe(true);
      expect(results.some(r => r.metadata.topicId === 't3')).toBe(false);
    });
  });
});
