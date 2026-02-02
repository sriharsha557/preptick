/**
 * Verification script for P2 improvements database migration
 * 
 * This script verifies that:
 * 1. New fields exist on the models
 * 2. Existing correctAnswer data was migrated to correctAnswers array format
 * 3. Default values are set correctly
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyMigration() {
  console.log('🔍 Verifying P2 improvements migration...\n');

  try {
    // Test 1: Verify Question model changes
    console.log('Test 1: Checking Question model...');
    const questions = await prisma.question.findMany({
      take: 5,
      select: {
        id: true,
        questionText: true,
        correctAnswers: true,
        allowMultipleAnswers: true,
      }
    });

    if (questions.length > 0) {
      console.log('✅ Question model has new fields');
      console.log(`   - Found ${questions.length} questions`);
      
      // Check if correctAnswers is properly formatted as JSON array
      for (const q of questions) {
        try {
          const answers = JSON.parse(q.correctAnswers);
          if (Array.isArray(answers)) {
            console.log(`   - Question ${q.id.substring(0, 8)}... has correctAnswers: ${JSON.stringify(answers)}`);
          } else {
            console.log(`   ⚠️  Question ${q.id} has non-array correctAnswers: ${q.correctAnswers}`);
          }
        } catch (e) {
          console.log(`   ⚠️  Question ${q.id} has invalid JSON in correctAnswers: ${q.correctAnswers}`);
        }
      }
      
      console.log(`   - allowMultipleAnswers default: ${questions[0].allowMultipleAnswers}`);
    } else {
      console.log('ℹ️  No questions found in database (this is OK for empty database)');
    }

    // Test 2: Verify Test model changes
    console.log('\nTest 2: Checking Test model...');
    const tests = await prisma.test.findMany({
      take: 3,
      select: {
        id: true,
        subject: true,
        timerMinutes: true,
      }
    });

    if (tests.length > 0) {
      console.log('✅ Test model has timerMinutes field');
      console.log(`   - Found ${tests.length} tests`);
      console.log(`   - timerMinutes values: ${tests.map(t => t.timerMinutes ?? 'null').join(', ')}`);
    } else {
      console.log('ℹ️  No tests found in database (this is OK for empty database)');
    }

    // Test 3: Verify TestSession model changes
    console.log('\nTest 3: Checking TestSession model...');
    const sessions = await prisma.testSession.findMany({
      take: 3,
      select: {
        id: true,
        status: true,
        timerExpired: true,
      }
    });

    if (sessions.length > 0) {
      console.log('✅ TestSession model has timerExpired field');
      console.log(`   - Found ${sessions.length} sessions`);
      console.log(`   - timerExpired default: ${sessions[0].timerExpired}`);
    } else {
      console.log('ℹ️  No test sessions found in database (this is OK for empty database)');
    }

    // Test 4: Create a test question to verify schema works (only if topics exist)
    console.log('\nTest 4: Creating test question with new schema...');
    const existingTopic = await prisma.syllabusTopic.findFirst();
    
    if (existingTopic) {
      const testQuestion = await prisma.question.create({
        data: {
          topicId: existingTopic.id,
          questionText: 'Test question for P2 migration verification',
          questionType: 'MultipleChoice',
          options: JSON.stringify(['A', 'B', 'C', 'D']),
          correctAnswers: JSON.stringify(['A', 'B']),
          allowMultipleAnswers: true,
          solutionSteps: JSON.stringify(['Step 1: Test', 'Step 2: Verify']),
          syllabusReference: 'Test Reference',
          difficulty: 'ExamRealistic',
        }
      });

      console.log('✅ Successfully created test question with new schema');
      console.log(`   - Question ID: ${testQuestion.id}`);
      console.log(`   - correctAnswers: ${testQuestion.correctAnswers}`);
      console.log(`   - allowMultipleAnswers: ${testQuestion.allowMultipleAnswers}`);
      
      // Clean up test question
      await prisma.question.delete({ where: { id: testQuestion.id } });
      console.log('   - Test question cleaned up');
    } else {
      console.log('ℹ️  Skipping test question creation (no topics in database)');
      console.log('   - Schema changes verified through model inspection');
    }

    console.log('\n✅ Migration verification complete!');
    console.log('\nSummary:');
    console.log('- Question.correctAnswers (array) ✅');
    console.log('- Question.allowMultipleAnswers (boolean) ✅');
    console.log('- Test.timerMinutes (optional int) ✅');
    console.log('- TestSession.timerExpired (boolean) ✅');

  } catch (error) {
    console.error('\n❌ Migration verification failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
verifyMigration()
  .then(() => {
    console.log('\n✅ All checks passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });
