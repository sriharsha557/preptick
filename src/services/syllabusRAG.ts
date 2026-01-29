// Syllabus RAG - Enhanced retrieval using document content

import { PrismaClient } from '@prisma/client';
import { EmbeddingService } from './embedding';
import { VectorStore } from './vectorStore';

export interface SyllabusContext {
  topicId: string;
  topicName: string;
  curriculum: string;
  grade: number;
  subject: string;
  content: string;
  relatedConcepts: string[];
}

export class SyllabusRAG {
  constructor(
    private prisma: PrismaClient,
    private embeddingService: EmbeddingService,
    private vectorStore: VectorStore
  ) {}

  /**
   * Get enriched syllabus context for a topic
   */
  async getSyllabusContext(topicId: string): Promise<SyllabusContext | null> {
    const topic = await this.prisma.syllabusTopic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      return null;
    }

    const learningObjectives = JSON.parse(topic.learningObjectives);

    return {
      topicId: topic.id,
      topicName: topic.topicName,
      curriculum: topic.curriculum,
      grade: topic.grade,
      subject: topic.subject,
      content: topic.officialContent,
      relatedConcepts: learningObjectives,
    };
  }

  /**
   * Search for relevant syllabus content using semantic search
   */
  async searchSyllabusContent(
    query: string,
    curriculum: string,
    grade: number,
    subject: string,
    limit: number = 5
  ): Promise<SyllabusContext[]> {
    // Generate embedding for the query
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);

    // Get all topics for the curriculum/grade/subject
    const topics = await this.prisma.syllabusTopic.findMany({
      where: {
        curriculum,
        grade,
        subject,
      },
    });

    // Index topics if not already indexed
    for (const topic of topics) {
      const key = `syllabus:${topic.id}`;
      const existing = this.vectorStore.get(key);
      
      if (!existing) {
        const embedding = await this.embeddingService.generateSyllabusEmbedding({
          topicId: topic.id,
          content: topic.officialContent,
          relatedConcepts: JSON.parse(topic.learningObjectives),
        });
        
        this.vectorStore.add(key, embedding, {
          topicId: topic.id,
          curriculum: topic.curriculum,
          grade: topic.grade,
          subject: topic.subject,
        });
      }
    }

    // Search for similar content
    const results = this.vectorStore.search(queryEmbedding, limit, {
      curriculum,
      grade,
      subject,
    });

    // Convert to SyllabusContext
    const contexts: SyllabusContext[] = [];
    for (const result of results) {
      const context = await this.getSyllabusContext(result.metadata.topicId);
      if (context) {
        contexts.push(context);
      }
    }

    return contexts;
  }

  /**
   * Get all topics for a subject with their content
   */
  async getTopicsWithContent(
    curriculum: string,
    grade: number,
    subject: string
  ): Promise<SyllabusContext[]> {
    const topics = await this.prisma.syllabusTopic.findMany({
      where: {
        curriculum,
        grade,
        subject,
      },
      orderBy: {
        topicName: 'asc',
      },
    });

    return topics.map(topic => ({
      topicId: topic.id,
      topicName: topic.topicName,
      curriculum: topic.curriculum,
      grade: topic.grade,
      subject: topic.subject,
      content: topic.officialContent,
      relatedConcepts: JSON.parse(topic.learningObjectives),
    }));
  }
}
