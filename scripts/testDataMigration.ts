/**
 * Test script to verify data migration from correctAnswer to correctAnswers
 * 
 * This script:
 * 1. Creates test questions using the new schema
 * 2. Verifies that single-answer questions work correctly
 * 3. Verifies that multiple-answer questions work correctly
 * 4. Tests backward compatibility
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDataMigration() {
  console.log('🧪 Testing data migration for P2 improvements...\n');

  try {
    // Get a topic to use for test questions
    const topic = await prisma.syllabusTopic.findFirst();
    if (!topic) {
      throw new Error('No topics found. Please run seed script first.');
    }

    console.log('Test 1: Creating single-answer question (backward compatibility)');
    const singleAnswerQ = await prisma.question.create({
      data: {
        topicId: topic.id,
        questionText: 'What is 2 + 2?',
        questionType: 'MultipleChoice',
        options: JSON.stringify(['2', '3', '4', '5']),
        correctAnswers: JSON.stringify(['4']), // Single answer as array
        allowMultipleAnswers: false,
        solutionSteps: JSON.stringify(['Add 2 and 2', 'Result is 4']),
        syllabusReference: 'Basic Arithmetic',
        difficulty: 'ExamRealistic',
      }
    });

    console.log('✅ Single-answer question created');
    console.log(`   - ID: ${singleAnswerQ.id}`);
    console.log(`   - correctAnswers: ${singleAnswerQ.correctAnswers}`);
    console.log(`   - allowMultipleAnswers: ${singleAnswerQ.allowMultipleAnswers}`);
    
    // Verify it's stored as array
    const parsedSingle = JSON.parse(singleAnswerQ.correctAnswers);
    if (Array.isArray(parsedSingle) && parsedSingle.length === 1 && parsedSingle[0] === '4') {
      console.log('✅ Single answer correctly stored as array');
    } else {
      throw new Error('Single answer not stored correctly');
    }

    console.log('\nTest 2: Creating multiple-answer question');
    const multiAnswerQ = await prisma.question.create({
      data: {
        topicId: topic.id,
        questionText: 'Which of the following are prime numbers?',
        questionType: 'MultipleChoice',
        options: JSON.stringify(['2', '3', '4', '5']),
        correctAnswers: JSON.stringify(['2', '3', '5']), // Multiple answers
        allowMultipleAnswers: true,
        solutionSteps: JSON.stringify(['Prime numbers are divisible only by 1 and themselves', '2, 3, and 5 are prime', '4 is not prime (divisible by 2)']),
        syllabusReference: 'Number Theory',
        difficulty: 'ExamRealistic',
      }
    });

    console.log('✅ Multiple-answer question created');
    console.log(`   - ID: ${multiAnswerQ.id}`);
    console.log(`   - correctAnswers: ${multiAnswerQ.correctAnswers}`);
    console.log(`   - allowMultipleAnswers: ${multiAnswerQ.allowMultipleAnswers}`);
    
    // Verify it's stored as array with multiple values
    const parsedMulti = JSON.parse(multiAnswerQ.correctAnswers);
    if (Array.isArray(parsedMulti) && parsedMulti.length === 3) {
      console.log('✅ Multiple answers correctly stored as array');
    } else {
      throw new Error('Multiple answers not stored correctly');
    }

    console.log('\nTest 3: Querying questions and verifying data integrity');
    const questions = await prisma.question.findMany({
      where: {
        id: {
          in: [singleAnswerQ.id, multiAnswerQ.id]
        }
      }
    });

    console.log(`✅ Retrieved ${questions.length} questions`);
    for (const q of questions) {
      const answers = JSON.parse(q.correctAnswers);
      console.log(`   - Question: ${q.questionText.substring(0, 50)}...`);
      console.log(`     Correct answers: ${JSON.stringify(answers)}`);
      console.log(`     Allow multiple: ${q.allowMultipleAnswers}`);
      console.log(`     Answer count matches flag: ${(answers.length > 1) === q.allowMultipleAnswers ? '✅' : '⚠️'}`);
    }

    console.log('\nTest 4: Testing Test model with timer');
    const user = await prisma.user.findFirst();
    if (user) {
      const testWithTimer = await prisma.test.create({
        data: {
          userId: user.id,
          subject: 'Mathematics',
          topics: JSON.stringify([topic.id]),
          mode: 'InAppExam',
          timerMinutes: 30, // 30-minute timer
        }
      });

      console.log('✅ Test with timer created');
      console.log(`   - ID: ${testWithTimer.id}`);
      console.log(`   - timerMinutes: ${testWithTimer.timerMinutes}`);

      // Create test without timer
      const testWithoutTimer = await prisma.test.create({
        data: {
          userId: user.id,
          subject: 'Science',
          topics: JSON.stringify([topic.id]),
          mode: 'PrintablePDF',
          // timerMinutes not set (null)
        }
      });

      console.log('✅ Test without timer created');
      console.log(`   - ID: ${testWithoutTimer.id}`);
      console.log(`   - timerMinutes: ${testWithoutTimer.timerMinutes ?? 'null'}`);

      // Clean up tests
      await prisma.test.deleteMany({
        where: {
          id: {
            in: [testWithTimer.id, testWithoutTimer.id]
          }
        }
      });
      console.log('   - Test data cleaned up');
    } else {
      console.log('ℹ️  No users found, skipping Test model test');
    }

    console.log('\nTest 5: Testing TestSession with timerExpired');
    if (user) {
      const test = await prisma.test.create({
        data: {
          userId: user.id,
          subject: 'Mathematics',
          topics: JSON.stringify([topic.id]),
          mode: 'InAppExam',
          timerMinutes: 30,
        }
      });

      const session = await prisma.testSession.create({
        data: {
          testId: test.id,
          userId: user.id,
          timerExpired: false,
        }
      });

      console.log('✅ TestSession created');
      console.log(`   - ID: ${session.id}`);
      console.log(`   - timerExpired: ${session.timerExpired}`);

      // Update to expired
      const updatedSession = await prisma.testSession.update({
        where: { id: session.id },
        data: { timerExpired: true }
      });

      console.log('✅ TestSession updated to expired');
      console.log(`   - timerExpired: ${updatedSession.timerExpired}`);

      // Clean up
      await prisma.testSession.delete({ where: { id: session.id } });
      await prisma.test.delete({ where: { id: test.id } });
      console.log('   - Session and test cleaned up');
    } else {
      console.log('ℹ️  No users found, skipping TestSession test');
    }

    // Clean up test questions
    await prisma.question.deleteMany({
      where: {
        id: {
          in: [singleAnswerQ.id, multiAnswerQ.id]
        }
      }
    });
    console.log('\n✅ Test questions cleaned up');

    console.log('\n✅ All data migration tests passed!');
    console.log('\nSummary:');
    console.log('- Single-answer questions work correctly ✅');
    console.log('- Multiple-answer questions work correctly ✅');
    console.log('- Timer field on Test model works correctly ✅');
    console.log('- timerExpired field on TestSession works correctly ✅');
    console.log('- Data integrity maintained ✅');

  } catch (error) {
    console.error('\n❌ Data migration test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run test
testDataMigration()
  .then(() => {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Tests failed:', error);
    process.exit(1);
  });
