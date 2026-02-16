// Syllabus API routes

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/db';
import Groq from 'groq-sdk';
import {
  syllabusParamsSchema,
  topicsParamsSchema,
  validateTopicSchema,
  formatZodErrors,
  type ValidateTopicInput,
} from '../lib/validators';

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

      // First try database for curated topics (case-insensitive subject match)
      const dbTopics = await prisma.syllabusTopic.findMany({
        where: {
          curriculum: {
            equals: curriculum,
            mode: 'insensitive',
          },
          grade: gradeNum,
          subject: {
            equals: subject,
            mode: 'insensitive',
          },
        },
        orderBy: {
          topicName: 'asc',
        },
      });

      // If database has topics, use them (preferred)
      if (dbTopics.length > 0) {
        fastify.log.info(`Found ${dbTopics.length} curated topics in database for ${curriculum} Grade ${gradeNum} ${subject}`);
        
        // Deduplicate topics by name while preserving all IDs (Requirement 4.1, 4.2)
        const topicMap = new Map<string, string[]>();
        
        dbTopics.forEach(topic => {
          const existing = topicMap.get(topic.topicName);
          if (existing) {
            existing.push(topic.id);
          } else {
            topicMap.set(topic.topicName, [topic.id]);
          }
        });
        
        // Return deduplicated topics with combined IDs (Requirement 4.4)
        const deduplicatedTopics = Array.from(topicMap.entries()).map(([name, ids]) => ({
          topicId: ids.join(','), // Combine IDs for multi-selection
          topicName: name,
          syllabusCount: ids.length, // Track how many syllabus entries
        }));
        
        fastify.log.info(`Deduplicated to ${deduplicatedTopics.length} unique topics`);
        
        return reply.send({
          curriculum,
          grade: gradeNum,
          subject,
          topics: deduplicatedTopics,
          source: 'database',
        });
      }

      // Fallback to LLM for dynamic topic generation if no DB topics
      if (groq) {
        try {
          fastify.log.info(`No DB topics found, attempting LLM topic generation for ${curriculum} Grade ${gradeNum} ${subject}`);
          const llmTopics = await generateTopicsWithLLM(curriculum, gradeNum, subject);
          fastify.log.info(`LLM generated ${llmTopics.length} topics successfully`);
          return reply.send({
            curriculum,
            grade: gradeNum,
            subject,
            topics: llmTopics,
            source: 'llm',
          });
        } catch (llmError) {
          fastify.log.error('LLM topic generation failed:', llmError);
        }
      } else {
        fastify.log.warn('GROQ API key not configured - LLM topic generation unavailable');
      }

      // Return empty if both methods fail
      return reply.send({
        curriculum,
        grade: gradeNum,
        subject,
        topics: [],
        source: 'none',
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

  // Validate custom topic relevance using LLM
  fastify.post('/api/topics/validate', async (
    request: FastifyRequest<{ Body: ValidateTopicInput }>,
    reply: FastifyReply
  ) => {
    try {
      // Validate request body with Zod
      const validation = validateTopicSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({
          error: 'Validation failed',
          message: formatZodErrors(validation.error),
        });
      }

      const { customTopic, curriculum, grade, subject } = validation.data;

      if (!groq) {
        return reply.status(503).send({
          error: 'Service unavailable',
          message: 'LLM service is not configured',
        });
      }

      // Use LLM to validate if the topic is relevant
      const prompt = `You are an expert in ${curriculum} curriculum for Class ${grade} ${subject}.

A student wants to study the topic: "${customTopic}"

Evaluate if this topic is appropriate for ${curriculum} Class ${grade} ${subject}:
1. Is this topic typically part of the official ${curriculum} Class ${grade} ${subject} syllabus?
2. Is the difficulty level appropriate for Class ${grade} students?
3. Is the topic within the scope of ${subject}?

Return a JSON object with this exact format:
{
  "valid": true or false,
  "feedback": "A brief, helpful explanation (1-2 sentences)"
}

If valid, the feedback should confirm the topic is appropriate.
If invalid, the feedback should explain why (e.g., "This topic is typically covered in higher grades" or "This topic is part of a different subject").`;

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an educational curriculum expert. Respond only with valid JSON.',
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
        return reply.status(500).send({
          error: 'LLM error',
          message: 'No response from LLM',
        });
      }

      const result = JSON.parse(responseContent);

      if (result.valid) {
        // Generate a topic ID for the custom topic
        const sanitizedTopic = customTopic
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        const topicId = `custom-${curriculum.toLowerCase()}-${grade}-${subject.toLowerCase()}-${sanitizedTopic}`;

        return reply.send({
          valid: true,
          feedback: result.feedback || `"${customTopic}" is a valid topic for Class ${grade} ${subject}.`,
          topicId,
          topicName: customTopic,
        });
      } else {
        return reply.send({
          valid: false,
          feedback: result.feedback || `"${customTopic}" is not appropriate for Class ${grade} ${subject}.`,
        });
      }
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
