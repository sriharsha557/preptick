// Syllabus API routes

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/db';
import Groq from 'groq-sdk';

// Initialize GROQ client for LLM
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

export async function syllabusRoutes(fastify: FastifyInstance) {
  // Get syllabus for curriculum and grade
  fastify.get('/api/syllabus/:curriculum/:grade', async (
    request: FastifyRequest<{ 
      Params: { curriculum: string; grade: string };
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { curriculum, grade } = request.params;
      const gradeNum = parseInt(grade);

      if (isNaN(gradeNum) || gradeNum < 1 || gradeNum > 12) {
        return reply.status(400).send({
          error: 'Invalid grade',
          message: 'Grade must be between 1 and 12',
        });
      }

      const syllabusEntries = await prisma.syllabus.findMany({
        where: {
          curriculum: curriculum as 'CBSE' | 'Cambridge',
          grade: gradeNum,
        },
        include: {
          topics: {
            orderBy: {
              topicName: 'asc',
            },
          },
        },
      });

      return reply.send({
        curriculum,
        grade: gradeNum,
        subjects: syllabusEntries.map(entry => ({
          syllabusId: entry.id,
          subject: entry.subject,
          topics: entry.topics.map(topic => ({
            topicId: topic.id,
            topicName: topic.topicName,
            description: topic.description,
          })),
        })),
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get topics for a specific subject
  fastify.get('/api/syllabus/:curriculum/:grade/:subject/topics', async (
    request: FastifyRequest<{ 
      Params: { curriculum: string; grade: string; subject: string };
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { curriculum, grade, subject } = request.params;
      const gradeNum = parseInt(grade);

      if (isNaN(gradeNum) || gradeNum < 1 || gradeNum > 12) {
        return reply.status(400).send({
          error: 'Invalid grade',
          message: 'Grade must be between 1 and 12',
        });
      }

      // Try LLM first for dynamic topic generation
      if (groq) {
        try {
          const llmTopics = await generateTopicsWithLLM(curriculum, gradeNum, subject);
          return reply.send({
            curriculum,
            grade: gradeNum,
            subject,
            topics: llmTopics,
            source: 'llm',
          });
        } catch (llmError) {
          fastify.log.warn('LLM topic generation failed, falling back to database:', llmError);
        }
      }

      // Fallback to database
      const topics = await prisma.syllabusTopic.findMany({
        where: {
          curriculum,
          grade: gradeNum,
          subject,
        },
        orderBy: {
          topicName: 'asc',
        },
      });

      return reply.send({
        curriculum,
        grade: gradeNum,
        subject,
        topics: topics.map(topic => ({
          topicId: topic.id,
          topicName: topic.topicName,
        })),
        source: 'database',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get all subjects for a curriculum and grade
  fastify.get('/api/syllabus/:curriculum/:grade/subjects', async (
    request: FastifyRequest<{ 
      Params: { curriculum: string; grade: string };
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { curriculum, grade } = request.params;
      const gradeNum = parseInt(grade);

      if (isNaN(gradeNum) || gradeNum < 1 || gradeNum > 12) {
        return reply.status(400).send({
          error: 'Invalid grade',
          message: 'Grade must be between 1 and 12',
        });
      }

      const syllabusEntries = await prisma.syllabus.findMany({
        where: {
          curriculum: curriculum as 'CBSE' | 'Cambridge',
          grade: gradeNum,
        },
        select: {
          subject: true,
        },
        distinct: ['subject'],
      });

      return reply.send({
        curriculum,
        grade: gradeNum,
        subjects: syllabusEntries.map(entry => entry.subject),
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get topic details by ID
  fastify.get('/api/syllabus/topic/:topicId', async (
    request: FastifyRequest<{ 
      Params: { topicId: string };
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { topicId } = request.params;

      const topic = await prisma.syllabusTopic.findUnique({
        where: { id: topicId },
        include: {
          syllabus: true,
        },
      });

      if (!topic) {
        return reply.status(404).send({
          error: 'Topic not found',
          message: `Topic with ID ${topicId} not found`,
        });
      }

      return reply.send({
        topicId: topic.id,
        topicName: topic.topicName,
        description: topic.description,
        syllabus: {
          syllabusId: topic.syllabus.id,
          curriculum: topic.syllabus.curriculum,
          grade: topic.syllabus.grade,
          subject: topic.syllabus.subject,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}

/**
 * Generate topics using LLM based on curriculum, grade, and subject
 */
async function generateTopicsWithLLM(
  curriculum: string,
  grade: number,
  subject: string
): Promise<Array<{ topicId: string; topicName: string }>> {
  if (!groq) {
    throw new Error('GROQ API not configured');
  }

  const prompt = `Generate a comprehensive list of topics for ${curriculum} curriculum, Class ${grade}, ${subject} subject.

Requirements:
1. List all major topics covered in the official ${curriculum} Class ${grade} ${subject} syllabus
2. Include 8-15 topics that are typically taught in this grade
3. Topics should be specific and exam-relevant
4. Use standard terminology from the official syllabus
5. Topics should be suitable for generating exam questions

Return ONLY a JSON object with this exact format:
{
  "topics": [
    "Topic Name 1",
    "Topic Name 2",
    "Topic Name 3"
  ]
}

Example for CBSE Class 10 Mathematics:
{
  "topics": [
    "Real Numbers",
    "Polynomials",
    "Linear Equations in Two Variables",
    "Quadratic Equations",
    "Arithmetic Progressions",
    "Triangles",
    "Coordinate Geometry",
    "Trigonometry",
    "Circles",
    "Surface Areas and Volumes",
    "Statistics",
    "Probability"
  ]
}`;

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are an expert in educational curricula, specifically CBSE and Cambridge syllabi for grades 1-10. Generate accurate, exam-relevant topic lists based on official syllabi.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.3,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  });

  const responseContent = completion.choices[0]?.message?.content;
  if (!responseContent) {
    throw new Error('No response from LLM');
  }

  const parsedResponse = JSON.parse(responseContent);
  
  if (!parsedResponse.topics || !Array.isArray(parsedResponse.topics)) {
    throw new Error('Invalid response format from LLM');
  }

  // Convert to expected format with generated IDs
  return parsedResponse.topics.map((topicName: string, index: number) => ({
    topicId: `llm-${curriculum}-${grade}-${subject}-${index}`.toLowerCase().replace(/\s+/g, '-'),
    topicName: topicName,
  }));
}
