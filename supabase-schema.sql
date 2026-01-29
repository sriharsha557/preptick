-- PrepTick Database Schema for Supabase PostgreSQL
-- Run this script in Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS "UserQuestion" CASCADE;
DROP TABLE IF EXISTS "PerformanceReport" CASCADE;
DROP TABLE IF EXISTS "Evaluation" CASCADE;
DROP TABLE IF EXISTS "UserResponse" CASCADE;
DROP TABLE IF EXISTS "TestSession" CASCADE;
DROP TABLE IF EXISTS "TestQuestion" CASCADE;
DROP TABLE IF EXISTS "Test" CASCADE;
DROP TABLE IF EXISTS "Question" CASCADE;
DROP TABLE IF EXISTS "SyllabusTopic" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- User Profiles Table
CREATE TABLE "User" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "email" TEXT UNIQUE NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "curriculum" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "subjects" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "User_curriculum_grade_idx" ON "User"("curriculum", "grade");

-- Syllabus Topics Table
CREATE TABLE "SyllabusTopic" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "curriculum" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "topicName" TEXT NOT NULL,
    "parentTopicId" TEXT,
    "syllabusSection" TEXT NOT NULL,
    "officialContent" TEXT NOT NULL DEFAULT '',
    "learningObjectives" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "SyllabusTopic_parentTopicId_fkey" FOREIGN KEY ("parentTopicId") 
        REFERENCES "SyllabusTopic"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "SyllabusTopic_curriculum_grade_subject_idx" ON "SyllabusTopic"("curriculum", "grade", "subject");
CREATE INDEX "SyllabusTopic_parentTopicId_idx" ON "SyllabusTopic"("parentTopicId");

-- Questions in the Question Bank
CREATE TABLE "Question" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "topicId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "options" TEXT,
    "correctAnswer" TEXT NOT NULL,
    "syllabusReference" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'ExamRealistic',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Question_topicId_fkey" FOREIGN KEY ("topicId") 
        REFERENCES "SyllabusTopic"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Question_topicId_idx" ON "Question"("topicId");

-- Mock Tests Table
CREATE TABLE "Test" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "topics" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Generated',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Test_userId_fkey" FOREIGN KEY ("userId") 
        REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Test_userId_createdAt_idx" ON "Test"("userId", "createdAt");
CREATE INDEX "Test_status_idx" ON "Test"("status");

-- Junction table for Test-Question relationship
CREATE TABLE "TestQuestion" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "testId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "TestQuestion_testId_fkey" FOREIGN KEY ("testId") 
        REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TestQuestion_questionId_fkey" FOREIGN KEY ("questionId") 
        REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TestQuestion_testId_questionId_key" UNIQUE ("testId", "questionId")
);

CREATE INDEX "TestQuestion_testId_order_idx" ON "TestQuestion"("testId", "order");

-- Test Sessions (for in-app exams)
CREATE TABLE "TestSession" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "testId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'InProgress',
    CONSTRAINT "TestSession_testId_fkey" FOREIGN KEY ("testId") 
        REFERENCES "Test"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TestSession_userId_fkey" FOREIGN KEY ("userId") 
        REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "TestSession_testId_idx" ON "TestSession"("testId");
CREATE INDEX "TestSession_userId_idx" ON "TestSession"("userId");
CREATE INDEX "TestSession_status_idx" ON "TestSession"("status");

-- User Responses during test
CREATE TABLE "UserResponse" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userAnswer" TEXT NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserResponse_sessionId_fkey" FOREIGN KEY ("sessionId") 
        REFERENCES "TestSession"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserResponse_sessionId_questionId_key" UNIQUE ("sessionId", "questionId")
);

CREATE INDEX "UserResponse_sessionId_idx" ON "UserResponse"("sessionId");

-- Test Evaluations
CREATE TABLE "Evaluation" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "testId" TEXT UNIQUE NOT NULL,
    "userId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "correctCount" INTEGER NOT NULL,
    "totalCount" INTEGER NOT NULL,
    "topicScores" TEXT NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Evaluation_testId_fkey" FOREIGN KEY ("testId") 
        REFERENCES "Test"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Evaluation_userId_fkey" FOREIGN KEY ("userId") 
        REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Evaluation_userId_evaluatedAt_idx" ON "Evaluation"("userId", "evaluatedAt");

-- Performance Reports
CREATE TABLE "PerformanceReport" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "testId" TEXT UNIQUE NOT NULL,
    "userId" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "weakTopics" TEXT NOT NULL,
    "improvementSuggestions" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PerformanceReport_testId_fkey" FOREIGN KEY ("testId") 
        REFERENCES "Test"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PerformanceReport_userId_fkey" FOREIGN KEY ("userId") 
        REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PerformanceReport_evaluationId_fkey" FOREIGN KEY ("evaluationId") 
        REFERENCES "Evaluation"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "PerformanceReport_userId_createdAt_idx" ON "PerformanceReport"("userId", "createdAt");

-- Track which questions each user has seen
CREATE TABLE "UserQuestion" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserQuestion_userId_fkey" FOREIGN KEY ("userId") 
        REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserQuestion_questionId_fkey" FOREIGN KEY ("questionId") 
        REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserQuestion_userId_questionId_key" UNIQUE ("userId", "questionId")
);

CREATE INDEX "UserQuestion_userId_idx" ON "UserQuestion"("userId");

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'PrepTick database schema created successfully!';
    RAISE NOTICE 'All tables, indexes, and foreign keys have been set up.';
    RAISE NOTICE 'Next step: Run the seed script to populate initial data.';
END $$;
