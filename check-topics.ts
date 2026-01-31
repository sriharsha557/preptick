import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTopics() {
  console.log('Checking topics in database...\n');
  
  const topics = await prisma.syllabusTopic.findMany({
    where: {
      curriculum: 'CBSE',
      grade: 10,
      subject: 'Mathematics',
    },
    take: 10,
  });
  
  console.log(`Found ${topics.length} Mathematics topics for CBSE Grade 10:`);
  topics.forEach(topic => {
    console.log(`- ${topic.id}: ${topic.topicName}`);
  });
  
  await prisma.$disconnect();
}

checkTopics();
