// Syllabus Service - Provides curriculum-specific topic hierarchies and validation

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type Curriculum = 'CBSE' | 'Cambridge';
export type Subject = string;
export type TopicId = string;

export interface Topic {
  topicId: TopicId;
  name: string;
  parentTopic?: TopicId;
  syllabusSection: string;
  curriculum: Curriculum;
  grade: number;
  subject: Subject;
}

export interface SyllabusContent {
  topicId: TopicId;
  officialText: string;
  learningObjectives: string[];
  keyTerms: string[];
}

export interface ValidationError {
  type: 'InvalidTopic' | 'InvalidCurriculum' | 'InvalidGrade';
  message: string;
  details?: any;
}

/**
 * Get all topics for a specific curriculum, grade, and subject
 */
export async function getTopicsForSubject(
  curriculum: Curriculum,
  grade: number,
  subject: Subject
): Promise<Topic[]> {
  const topics = await prisma.syllabusTopic.findMany({
    where: {
      curriculum,
      grade,
      subject,
    },
    orderBy: {
      topicName: 'asc',
    },
  });

  return topics.map((t): Topic => ({
    topicId: t.id,
    name: t.topicName,
    parentTopic: t.parentTopicId || undefined,
    syllabusSection: t.syllabusSection,
    curriculum: t.curriculum as Curriculum,
    grade: t.grade,
    subject: t.subject,
  }));
}

/**
 * Validate that all topic IDs exist in the syllabus for the given curriculum and grade
 */
export async function validateTopics(
  curriculum: Curriculum,
  grade: number,
  topicIds: TopicId[]
): Promise<{ valid: boolean; error?: ValidationError }> {
  if (topicIds.length === 0) {
    return {
      valid: false,
      error: {
        type: 'InvalidTopic',
        message: 'At least one topic must be selected',
      },
    };
  }

  // Check if all topics exist
  const topics = await prisma.syllabusTopic.findMany({
    where: {
      id: { in: topicIds },
    },
  });

  if (topics.length !== topicIds.length) {
    const foundIds = new Set(topics.map((t) => t.id));
    const missingIds = topicIds.filter(id => !foundIds.has(id));
    return {
      valid: false,
      error: {
        type: 'InvalidTopic',
        message: 'Some topics do not exist',
        details: { missingIds },
      },
    };
  }

  // Check if all topics belong to the specified curriculum and grade
  const invalidTopics = topics.filter(
    (t) => t.curriculum !== curriculum || t.grade !== grade
  );

  if (invalidTopics.length > 0) {
    return {
      valid: false,
      error: {
        type: 'InvalidTopic',
        message: 'Some topics do not belong to the specified curriculum and grade',
        details: {
          invalidTopics: invalidTopics.map((t) => ({
            id: t.id,
            name: t.topicName,
            curriculum: t.curriculum,
            grade: t.grade,
          })),
        },
      },
    };
  }

  return { valid: true };
}

/**
 * Get detailed syllabus content for a specific topic
 */
export async function getSyllabusContent(topicId: TopicId): Promise<SyllabusContent | null> {
  const topic = await prisma.syllabusTopic.findUnique({
    where: { id: topicId },
  });

  if (!topic) {
    return null;
  }

  return {
    topicId: topic.id,
    officialText: topic.officialContent,
    learningObjectives: JSON.parse(topic.learningObjectives),
    keyTerms: [], // Could be added to the schema later
  };
}

/**
 * Get all available subjects for a curriculum and grade
 */
export async function getSubjectsForCurriculumAndGrade(
  curriculum: Curriculum,
  grade: number
): Promise<string[]> {
  const subjects = await prisma.syllabusTopic.groupBy({
    by: ['subject'],
    where: {
      curriculum,
      grade,
    },
  });

  return subjects.map((s) => s.subject).sort();
}

/**
 * Topic tree node for hierarchical representation
 */
export interface TopicTreeNode extends Topic {
  children: TopicTreeNode[];
}

/**
 * Build a hierarchical topic tree from a flat list of topics
 * Root topics (without parents) are at the top level
 */
export function buildTopicTree(topics: Topic[]): TopicTreeNode[] {
  // Create a map for quick lookup
  const topicMap = new Map<TopicId, TopicTreeNode>();
  
  // Initialize all nodes
  topics.forEach(topic => {
    topicMap.set(topic.topicId, { ...topic, children: [] });
  });
  
  // Build the tree structure
  const rootNodes: TopicTreeNode[] = [];
  
  topics.forEach(topic => {
    const node = topicMap.get(topic.topicId)!;
    
    if (topic.parentTopic) {
      // Add to parent's children
      const parent = topicMap.get(topic.parentTopic);
      if (parent) {
        parent.children.push(node);
      } else {
        // Parent not found, treat as root
        rootNodes.push(node);
      }
    } else {
      // No parent, this is a root node
      rootNodes.push(node);
    }
  });
  
  return rootNodes;
}
