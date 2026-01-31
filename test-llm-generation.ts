// Test LLM question generation
import { PrismaClient } from '@prisma/client';
import { LLMQuestionGeneratorService } from './src/services/llmQuestionGenerator';
import { RAGRetrieverImpl } from './src/services/ragRetriever';

const prisma = new PrismaClient();

async function testLLMGeneration() {
  try {
    console.log('Testing LLM Question Generation...\n');

    // Check if GROQ API key is configured
    if (!process.env.GROQ_API_KEY) {
      console.error('❌ GROQ_API_KEY not found in environment');
      process.exit(1);
    }
    console.log('✓ GROQ API key found');

    // Initialize services
    const ragRetriever = new RAGRetrieverImpl(prisma);
    const llmGenerator = new LLMQuestionGeneratorService(process.env.GROQ_API_KEY);

    // Get a sample topic
    const topics = await prisma.syllabusTopic.findMany({
      where: {
        subject: 'Mathematics',
      },
      take: 1,
    });

    if (topics.length === 0) {
      console.error('❌ No Mathematics topics found in database');
      process.exit(1);
    }

    const topic = topics[0];
    console.log(`✓ Using topic: ${topic.name} (ID: ${topic.id})\n`);

    // Get syllabus context
    const syllabusContext = await ragRetriever.getSyllabusContext(topic.id);
    console.log('✓ Retrieved syllabus context');

    // Generate 2 questions
    console.log('\nGenerating 2 questions using LLM...');
    const result = await llmGenerator.generateQuestions(syllabusContext, 2, []);

    if (!result.ok) {
      console.error('❌ Generation failed:', result.error);
      process.exit(1);
    }

    console.log(`✓ Successfully generated ${result.value.length} questions\n`);

    // Display generated questions
    result.value.forEach((q, index) => {
      console.log(`Question ${index + 1}:`);
      console.log(`  ID: ${q.questionId}`);
      console.log(`  Topic: ${q.topicId}`);
      console.log(`  Type: ${q.questionType}`);
      console.log(`  Text: ${q.questionText}`);
      if (q.options) {
        console.log(`  Options: ${q.options.join(', ')}`);
      }
      console.log(`  Correct Answer: ${q.correctAnswer}`);
      console.log(`  Difficulty: ${q.difficulty}`);
      console.log();
    });

    console.log('✅ LLM generation test completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testLLMGeneration();
