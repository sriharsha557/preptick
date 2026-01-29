// Tests for Syllabus Service

import { describe, it, expect, beforeAll } from 'vitest';
import {
  getTopicsForSubject,
  validateTopics,
  getSyllabusContent,
  getSubjectsForCurriculumAndGrade,
  buildTopicTree,
} from './syllabus';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Syllabus Service', () => {
  let cbseMath5TopicIds: string[] = [];
  let cambridgeScience5TopicIds: string[] = [];

  beforeAll(async () => {
    // Get some topic IDs for testing
    const cbseMath5Topics = await prisma.syllabusTopic.findMany({
      where: { curriculum: 'CBSE', grade: 5, subject: 'Mathematics' },
      take: 2,
    });
    cbseMath5TopicIds = cbseMath5Topics.map(t => t.id);

    const cambridgeScience5Topics = await prisma.syllabusTopic.findMany({
      where: { curriculum: 'Cambridge', grade: 5, subject: 'Science' },
      take: 2,
    });
    cambridgeScience5TopicIds = cambridgeScience5Topics.map(t => t.id);
  });

  describe('getTopicsForSubject', () => {
    it('should return topics for CBSE Grade 5 Mathematics', async () => {
      const topics = await getTopicsForSubject('CBSE', 5, 'Mathematics');
      
      expect(topics.length).toBeGreaterThan(0);
      expect(topics.every(t => t.curriculum === 'CBSE')).toBe(true);
      expect(topics.every(t => t.grade === 5)).toBe(true);
      expect(topics.every(t => t.subject === 'Mathematics')).toBe(true);
    });

    it('should return topics for Cambridge Grade 5 Science', async () => {
      const topics = await getTopicsForSubject('Cambridge', 5, 'Science');
      
      expect(topics.length).toBeGreaterThan(0);
      expect(topics.every(t => t.curriculum === 'Cambridge')).toBe(true);
      expect(topics.every(t => t.grade === 5)).toBe(true);
      expect(topics.every(t => t.subject === 'Science')).toBe(true);
    });

    it('should return empty array for non-existent subject', async () => {
      const topics = await getTopicsForSubject('CBSE', 5, 'NonExistentSubject');
      expect(topics).toEqual([]);
    });

    it('should include hierarchical information', async () => {
      const topics = await getTopicsForSubject('CBSE', 5, 'Mathematics');
      
      // Check if any topic has a parent (we know "Place Value" has parent "Numbers")
      const topicWithParent = topics.find(t => t.name === 'Place Value');
      if (topicWithParent) {
        expect(topicWithParent.parentTopic).toBeDefined();
      }
    });
  });

  describe('validateTopics', () => {
    it('should validate correct topics for CBSE Grade 5', async () => {
      const result = await validateTopics('CBSE', 5, cbseMath5TopicIds);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty topic list', async () => {
      const result = await validateTopics('CBSE', 5, []);
      expect(result.valid).toBe(false);
      expect(result.error?.type).toBe('InvalidTopic');
      expect(result.error?.message).toContain('At least one topic');
    });

    it('should reject non-existent topic IDs', async () => {
      const result = await validateTopics('CBSE', 5, ['non-existent-id']);
      expect(result.valid).toBe(false);
      expect(result.error?.type).toBe('InvalidTopic');
      expect(result.error?.message).toContain('do not exist');
    });

    it('should reject topics from wrong curriculum', async () => {
      // Try to validate Cambridge topics as CBSE
      const result = await validateTopics('CBSE', 5, cambridgeScience5TopicIds);
      expect(result.valid).toBe(false);
      expect(result.error?.type).toBe('InvalidTopic');
      expect(result.error?.message).toContain('do not belong');
    });

    it('should reject topics from wrong grade', async () => {
      // Try to validate Grade 5 topics as Grade 10
      const result = await validateTopics('CBSE', 10, cbseMath5TopicIds);
      expect(result.valid).toBe(false);
      expect(result.error?.type).toBe('InvalidTopic');
    });
  });

  describe('getSyllabusContent', () => {
    it('should return content for valid topic', async () => {
      const content = await getSyllabusContent(cbseMath5TopicIds[0]);
      
      expect(content).not.toBeNull();
      expect(content?.topicId).toBe(cbseMath5TopicIds[0]);
      expect(content?.officialText).toBeDefined();
      expect(Array.isArray(content?.learningObjectives)).toBe(true);
      expect(content?.learningObjectives.length).toBeGreaterThan(0);
    });

    it('should return null for non-existent topic', async () => {
      const content = await getSyllabusContent('non-existent-id');
      expect(content).toBeNull();
    });
  });

  describe('getSubjectsForCurriculumAndGrade', () => {
    it('should return subjects for CBSE Grade 5', async () => {
      const subjects = await getSubjectsForCurriculumAndGrade('CBSE', 5);
      
      expect(subjects.length).toBeGreaterThan(0);
      expect(subjects).toContain('Mathematics');
      expect(subjects).toContain('Science');
    });

    it('should return subjects for Cambridge Grade 5', async () => {
      const subjects = await getSubjectsForCurriculumAndGrade('Cambridge', 5);
      
      expect(subjects.length).toBeGreaterThan(0);
      expect(subjects).toContain('Mathematics');
      expect(subjects).toContain('Science');
    });

    it('should return empty array for grade with no topics', async () => {
      const subjects = await getSubjectsForCurriculumAndGrade('CBSE', 99);
      expect(subjects).toEqual([]);
    });

    it('should return sorted subjects', async () => {
      const subjects = await getSubjectsForCurriculumAndGrade('CBSE', 5);
      const sorted = [...subjects].sort();
      expect(subjects).toEqual(sorted);
    });
  });

  describe('Data Model Validation', () => {
    it('should have topics with all required fields', async () => {
      const topics = await getTopicsForSubject('CBSE', 5, 'Mathematics');
      
      topics.forEach(topic => {
        expect(topic.topicId).toBeDefined();
        expect(topic.name).toBeDefined();
        expect(topic.syllabusSection).toBeDefined();
        expect(topic.curriculum).toBeDefined();
        expect(topic.grade).toBeDefined();
        expect(topic.subject).toBeDefined();
      });
    });

    it('should have valid learning objectives in syllabus content', async () => {
      const content = await getSyllabusContent(cbseMath5TopicIds[0]);
      
      expect(content).not.toBeNull();
      expect(Array.isArray(content?.learningObjectives)).toBe(true);
      content?.learningObjectives.forEach(objective => {
        expect(typeof objective).toBe('string');
        expect(objective.length).toBeGreaterThan(0);
      });
    });
  });

  describe('buildTopicTree', () => {
    it('should build hierarchical topic tree from flat list', async () => {
      const topics = await getTopicsForSubject('CBSE', 5, 'Mathematics');
      const tree = buildTopicTree(topics);
      
      // Tree should have root nodes
      expect(tree.length).toBeGreaterThan(0);
      
      // Each node should have children array
      tree.forEach(node => {
        expect(Array.isArray(node.children)).toBe(true);
      });
    });

    it('should place topics with parents as children', async () => {
      const topics = await getTopicsForSubject('CBSE', 5, 'Mathematics');
      const tree = buildTopicTree(topics);
      
      // Find a parent topic (e.g., "Numbers")
      const findNodeByName = (nodes: any[], name: string): any => {
        for (const node of nodes) {
          if (node.name === name) return node;
          const found = findNodeByName(node.children, name);
          if (found) return found;
        }
        return null;
      };
      
      const numbersNode = findNodeByName(tree, 'Numbers');
      if (numbersNode) {
        // Numbers should have children like "Place Value"
        expect(numbersNode.children.length).toBeGreaterThan(0);
        const hasPlaceValue = numbersNode.children.some((c: any) => c.name === 'Place Value');
        expect(hasPlaceValue).toBe(true);
      }
    });

    it('should handle topics without parents as root nodes', async () => {
      const topics = await getTopicsForSubject('CBSE', 5, 'Mathematics');
      const tree = buildTopicTree(topics);
      
      // Root nodes should not have parentTopic
      tree.forEach(node => {
        expect(node.parentTopic).toBeUndefined();
      });
    });

    it('should preserve all topic properties in tree nodes', async () => {
      const topics = await getTopicsForSubject('CBSE', 5, 'Mathematics');
      const tree = buildTopicTree(topics);
      
      const checkNode = (node: any) => {
        expect(node.topicId).toBeDefined();
        expect(node.name).toBeDefined();
        expect(node.curriculum).toBe('CBSE');
        expect(node.grade).toBe(5);
        expect(node.subject).toBe('Mathematics');
        expect(node.syllabusSection).toBeDefined();
        expect(Array.isArray(node.children)).toBe(true);
        
        node.children.forEach(checkNode);
      };
      
      tree.forEach(checkNode);
    });
  });
});
