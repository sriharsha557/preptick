import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkQuestions() {
  console.log('Checking questions in database...\n');
  
  // Check total questions
  const totalQuestions = await prisma.question.count();
  console.log(`Total questions in database: ${totalQuestions}\n`);
  
  // Check questions for Mathematics topics
  const mathTopics = await prisma.syllabusTopic.findMany({
    where: {
      curriculum: 'CBSE',
      grade: 10,
      subject: 'Mathematics',
    },
  });
  
  console.log('Mathematics topics:');
  for (const topic of mathTopics) {
    const questionCount = await prisma.question.count({
      where: { topicId: topic.id },
    });
    console.log(`- ${topic.topicName} (${topic.id}): ${questionCount} questions`);
  }
  
  await prisma.$disconnect();
}

checkQuestions();
