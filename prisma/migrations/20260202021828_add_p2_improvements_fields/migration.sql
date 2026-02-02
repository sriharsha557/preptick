/*
  Warnings:

  - You are about to drop the column `correctAnswer` on the `Question` table. All the data in the column will be lost.

*/

-- Step 1: Add new columns with defaults
ALTER TABLE "Question" 
ADD COLUMN "allowMultipleAnswers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "correctAnswers" TEXT NOT NULL DEFAULT '[]';

-- Step 2: Migrate existing correctAnswer data to correctAnswers array format
-- Convert single answer string to JSON array format: "A" -> ["A"]
UPDATE "Question" 
SET "correctAnswers" = '["' || "correctAnswer" || '"]'
WHERE "correctAnswer" IS NOT NULL AND "correctAnswer" != '';

-- Step 3: Now safe to drop the old column
ALTER TABLE "Question" DROP COLUMN "correctAnswer";

-- Step 4: Add new fields to Test and TestSession
ALTER TABLE "Test" ADD COLUMN "timerMinutes" INTEGER;

ALTER TABLE "TestSession" ADD COLUMN "timerExpired" BOOLEAN NOT NULL DEFAULT false;
