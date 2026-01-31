import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addTestQuestions() {
  console.log('Adding test questions...\n');
  
  // Get Mathematics topics
  const topics = await prisma.syllabusTopic.findMany({
    where: {
      curriculum: 'CBSE',
      grade: 10,
      subject: 'Mathematics',
    },
  });
  
  console.log(`Found ${topics.length} Mathematics topics\n`);
  
  // Add 5 questions for each topic
  for (const topic of topics) {
    console.log(`Adding questions for ${topic.topicName}...`);
    
    for (let i = 1; i <= 5; i++) {
      await prisma.question.create({
        data: {
          topicId: topic.id,
          questionText: `${topic.topicName} - Sample Question ${i}: Solve the problem related to ${topic.topicName.toLowerCase()}.`,
          questionType: 'MultipleChoice',
          options: JSON.stringify(['Option A', 'Option B', 'Option C', 'Option D']),
          correctAnswer: 'Option A',
          syllabusReference: `CBSE Grade 10 Mathematics - ${topic.topicName}`,
          createdAt: new Date(),
        },
      });
    }
    
    console.log(`  Added 5 questions for ${topic.topicName}`);
  }
  
  const totalQuestions = await prisma.question.count();
  console.log(`\n✅ Done! Total questions in database: ${totalQuestions}`);
  
  await prisma.$disconnect();
}

addTestQuestions();
