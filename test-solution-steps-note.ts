// Quick test to verify solution steps note is added
import { generateAnswerKey, generatePDF } from './src/services/pdfGenerator';
import { MockTest, Question } from './src/types';

async function testSolutionStepsNote() {
  console.log('Testing solution steps note...\n');

  // Test 1: Question with solution steps
  const questionWithSteps: Question = {
    questionId: 'q1',
    topicId: 't1',
    questionText: 'What is 2+2?',
    questionType: 'Numerical',
    correctAnswer: '4',
    solutionSteps: ['Step 1: Add 2 + 2', 'Step 2: Result is 4'],
    syllabusReference: 'Arithmetic',
    difficulty: 'ExamRealistic',
    createdAt: new Date(),
  };

  // Test 2: Question without solution steps
  const questionWithoutSteps: Question = {
    questionId: 'q2',
    topicId: 't1',
    questionText: 'What is 3+3?',
    questionType: 'Numerical',
    correctAnswer: '6',
    // No solutionSteps
    syllabusReference: 'Arithmetic',
    difficulty: 'ExamRealistic',
    createdAt: new Date(),
  };

  const answerKey = new Map<string, string>();
  answerKey.set('q1', '4');
  answerKey.set('q2', '6');

  const test: MockTest = {
    testId: 'test-123',
    configuration: {
      subject: 'Mathematics',
      topics: ['t1'],
      questionCount: 2,
      testCount: 1,
      testMode: 'PrintablePDF',
    },
    questions: [questionWithSteps, questionWithoutSteps],
    answerKey,
    createdAt: new Date(),
  };

  // Test generateAnswerKey
  console.log('Testing generateAnswerKey...');
  const result1 = await generateAnswerKey(test, ['Arithmetic']);
  if (result1.ok) {
    const pdfContent = result1.value.buffer.toString('utf-8');
    const hasNote = pdfContent.includes('Detailed solution steps not available');
    console.log('✓ generateAnswerKey: PDF generated successfully');
    console.log(`  - Contains note: ${hasNote ? '✓ YES' : '✗ NO'}`);
    console.log(`  - PDF size: ${result1.value.buffer.length} bytes`);
  } else {
    console.log('✗ generateAnswerKey: Failed to generate PDF');
  }

  // Test generatePDF with includeAnswers=true
  console.log('\nTesting generatePDF with includeAnswers=true...');
  const result2 = await generatePDF(test, true);
  if (result2.ok) {
    const pdfContent = result2.value.buffer.toString('utf-8');
    const hasNote = pdfContent.includes('Detailed solution steps not available');
    console.log('✓ generatePDF: PDF generated successfully');
    console.log(`  - Contains note: ${hasNote ? '✓ YES' : '✗ NO'}`);
    console.log(`  - PDF size: ${result2.value.buffer.length} bytes`);
  } else {
    console.log('✗ generatePDF: Failed to generate PDF');
  }

  console.log('\n✓ All tests completed!');
}

testSolutionStepsNote().catch(console.error);
