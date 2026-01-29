// Example usage of the vector database system

import { PrismaClient } from '@prisma/client';
import { createVectorDbWithGroq, createVectorDbSimple } from './vectorDb';
import { Question } from '../types';

/**
 * Example 1: Initialize vector database with GROQ API
 */
async function exampleWithGroq() {
  const prisma = new PrismaClient();
  const groqApiKey = process.env.GROQ_API_KEY || 'your-api-key-here';

  // Initialize the vector database with GROQ embeddings
  const { embeddingService, vectorStore, ragRetriever } = await createVectorDbWithGroq(
    prisma,
    groqApiKey
  );

  console.log(`Vector store initialized with ${vectorStore.size()} questions`);

  // Retrieve questions for specific topics
  const result = await ragRetriever.retrieveQuestions(
    ['topic-id-1', 'topic-id-2'], // Topic IDs
    10, // Number of questions to retrieve
    [] // Exclude question IDs (empty for no exclusions)
  );

  if (result.success) {
    console.log(`Retrieved ${result.value.length} questions`);
    result.value.forEach((question, index) => {
      console.log(`${index + 1}. ${question.questionText}`);
    });
  } else {
    console.error('Error retrieving questions:', result.error);
  }

  await prisma.$disconnect();
}

/**
 * Example 2: Initialize vector database with simple embeddings (for testing)
 */
async function exampleWithSimpleEmbeddings() {
  const prisma = new PrismaClient();

  // Initialize with simple embeddings (no API key needed)
  const { embeddingService, vectorStore, ragRetriever } = await createVectorDbSimple(prisma);

  console.log(`Vector store initialized with ${vectorStore.size()} questions`);

  // Index a new question
  const newQuestion: Question = {
    questionId: 'new-q1',
    topicId: 'topic-1',
    questionText: 'What is the capital of France?',
    questionType: 'ShortAnswer',
    correctAnswer: 'Paris',
    syllabusReference: 'World Geography - European Capitals',
    difficulty: 'ExamRealistic',
    createdAt: new Date(),
  };

  const indexResult = await ragRetriever.indexQuestion(newQuestion);
  if (indexResult.success) {
    console.log('Question indexed successfully');
  }

  await prisma.$disconnect();
}

/**
 * Example 3: Retrieve questions with exclusions (for generating multiple unique tests)
 */
async function exampleWithExclusions() {
  const prisma = new PrismaClient();
  const { ragRetriever } = await createVectorDbSimple(prisma);

  const topicIds = ['topic-1', 'topic-2'];
  const usedQuestionIds: string[] = [];

  // Generate 3 tests with 5 questions each, ensuring no duplicates
  for (let testNum = 1; testNum <= 3; testNum++) {
    const result = await ragRetriever.retrieveQuestions(
      topicIds,
      5,
      usedQuestionIds // Exclude previously used questions
    );

    if (result.success) {
      console.log(`\nTest ${testNum}:`);
      result.value.forEach((question, index) => {
        console.log(`  ${index + 1}. ${question.questionText}`);
        usedQuestionIds.push(question.questionId);
      });
    } else {
      console.error(`Error generating test ${testNum}:`, result.error);
      break;
    }
  }

  console.log(`\nTotal unique questions used: ${usedQuestionIds.length}`);

  await prisma.$disconnect();
}

/**
 * Example 4: Get syllabus context for a topic
 */
async function exampleGetSyllabusContext() {
  const prisma = new PrismaClient();
  const { ragRetriever } = await createVectorDbSimple(prisma);

  const topicId = 'some-topic-id';
  const context = await ragRetriever.getSyllabusContext(topicId);

  console.log('Syllabus Context:');
  console.log('Topic ID:', context.topicId);
  console.log('Content:', context.content);
  console.log('Related Concepts:', context.relatedConcepts.join(', '));

  await prisma.$disconnect();
}

/**
 * Example 5: Direct vector store operations
 */
async function exampleDirectVectorStore() {
  const prisma = new PrismaClient();
  const { vectorStore, embeddingService } = await createVectorDbSimple(prisma);

  // Get all questions for a specific topic
  const topicQuestions = await vectorStore.getByTopic('topic-1');
  console.log(`Found ${topicQuestions.length} questions for topic-1`);

  // Get questions for multiple topics
  const multiTopicQuestions = await vectorStore.getByTopics(['topic-1', 'topic-2']);
  console.log(`Found ${multiTopicQuestions.length} questions for topics 1 and 2`);

  // Perform a custom search
  const queryText = 'mathematics algebra equations';
  const queryEmbedding = await embeddingService.generateTextEmbedding(queryText);
  
  const searchResults = await vectorStore.search(queryEmbedding, {
    topK: 5,
    minSimilarity: 0.5,
    filter: (entry) => entry.metadata.topicId === 'topic-1',
  });

  console.log(`\nSearch results for "${queryText}":`);
  searchResults.forEach((result, index) => {
    console.log(`${index + 1}. Similarity: ${result.similarity.toFixed(3)}`);
    if (result.entry.metadata.question) {
      console.log(`   Question: ${result.entry.metadata.question.questionText}`);
    }
  });

  await prisma.$disconnect();
}

// Uncomment to run examples:
// exampleWithGroq().catch(console.error);
// exampleWithSimpleEmbeddings().catch(console.error);
// exampleWithExclusions().catch(console.error);
// exampleGetSyllabusContext().catch(console.error);
// exampleDirectVectorStore().catch(console.error);
