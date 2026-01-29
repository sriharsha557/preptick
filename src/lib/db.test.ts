// Tests for database setup and schema

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma, connectDb, disconnectDb } from './db';

describe('Database setup', () => {
  beforeAll(async () => {
    await connectDb();
  });

  afterAll(async () => {
    await disconnectDb();
  });

  it('should connect to database', async () => {
    // Simple query to verify connection
    const result = await prisma.$queryRaw`SELECT 1 as value`;
    expect(result).toBeDefined();
  });

  it('should have syllabus topics table', async () => {
    const topics = await prisma.syllabusTopic.findMany();
    expect(Array.isArray(topics)).toBe(true);
    // Should have seed data
    expect(topics.length).toBeGreaterThan(0);
  });

  it('should have users table', async () => {
    const users = await prisma.user.findMany();
    expect(Array.isArray(users)).toBe(true);
  });

  it('should have questions table', async () => {
    const questions = await prisma.question.findMany();
    expect(Array.isArray(questions)).toBe(true);
  });

  it('should have tests table', async () => {
    const tests = await prisma.test.findMany();
    expect(Array.isArray(tests)).toBe(true);
  });

  it('should retrieve seeded CBSE topics', async () => {
    const cbseTopics = await prisma.syllabusTopic.findMany({
      where: {
        curriculum: 'CBSE',
        grade: 5,
        subject: 'Mathematics',
      },
    });
    expect(cbseTopics.length).toBeGreaterThan(0);
    expect(cbseTopics[0].curriculum).toBe('CBSE');
    expect(cbseTopics[0].grade).toBe(5);
  });

  it('should retrieve seeded Cambridge topics', async () => {
    const cambridgeTopics = await prisma.syllabusTopic.findMany({
      where: {
        curriculum: 'Cambridge',
        grade: 5,
        subject: 'Science',
      },
    });
    expect(cambridgeTopics.length).toBeGreaterThan(0);
    expect(cambridgeTopics[0].curriculum).toBe('Cambridge');
    expect(cambridgeTopics[0].grade).toBe(5);
  });
});
