// Zod validation schemas for API endpoints

import { z } from 'zod';

// Common schemas
export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const curriculumSchema = z.enum(['CBSE', 'Cambridge'], {
  errorMap: () => ({ message: 'Curriculum must be CBSE or Cambridge' }),
});
export const gradeSchema = z.number().int().min(1).max(12, 'Grade must be between 1 and 12');
export const subjectsSchema = z.array(z.string()).min(1, 'At least one subject is required');

// Auth schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  curriculum: curriculumSchema,
  grade: gradeSchema,
  subjects: subjectsSchema,
});

// User profile schemas
export const updateProfileSchema = z.object({
  name: z.string().max(100).optional(),
  gender: z.string().max(20).optional(),
  schoolName: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  profilePicture: z.string().url().optional().or(z.literal('')),
  curriculum: curriculumSchema.optional(),
  grade: gradeSchema.optional(),
  subjects: z.string().optional(), // JSON string
});

export const userIdParamSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
});

// Test generation schemas
export const generateTestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  subject: z.string().min(1, 'Subject is required'),
  topics: z.array(z.string()).min(1, 'At least one topic is required'),
  questionCount: z.number().int().min(1).max(50, 'Question count must be between 1 and 50'),
  testCount: z.number().int().min(1).max(10).default(1),
  testMode: z.enum(['InAppExam', 'PDFDownload']).default('InAppExam'),
});

export const testIdParamSchema = z.object({
  testId: z.string().min(1, 'Test ID is required'),
});

export const sessionIdParamSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
});

export const submitAnswerSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  answer: z.string(),
});

export const submitTestSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
});

export const startTestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export const retryTestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

// Syllabus schemas
export const syllabusParamsSchema = z.object({
  curriculum: z.string().min(1),
  grade: z.string().regex(/^\d+$/, 'Grade must be a number'),
});

export const topicsParamsSchema = z.object({
  curriculum: z.string().min(1),
  grade: z.string().regex(/^\d+$/, 'Grade must be a number'),
  subject: z.string().min(1),
});

export const validateTopicSchema = z.object({
  customTopic: z.string().min(1, 'Topic name is required').max(200),
  curriculum: z.string().min(1),
  grade: z.number().int().min(1).max(12),
  subject: z.string().min(1),
});

export const topicIdParamSchema = z.object({
  topicId: z.string().min(1, 'Topic ID is required'),
});

// Validation helper function
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

// Format Zod errors for API response
export function formatZodErrors(error: z.ZodError): string {
  return error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
}

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type GenerateTestInput = z.infer<typeof generateTestSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
export type ValidateTopicInput = z.infer<typeof validateTopicSchema>;
