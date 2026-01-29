// Manual script to create topics from document folder

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating topics from documents folder...\n');

  // CBSE Class 3 English
  const cbse3English = await prisma.syllabusTopic.create({
    data: {
      curriculum: 'CBSE',
      grade: 3,
      subject: 'English',
      topicName: 'English - Complete Syllabus',
      syllabusSection: 'Full Syllabus',
      officialContent: 'CBSE Class 3 English Syllabus 2025-26 - Reading, Writing, Grammar, and Comprehension',
      learningObjectives: JSON.stringify([
        'Reading comprehension',
        'Vocabulary building',
        'Grammar basics',
        'Creative writing',
        'Listening skills'
      ]),
    },
  });

  // CBSE Class 3 Maths
  const cbse3Maths = await prisma.syllabusTopic.create({
    data: {
      curriculum: 'CBSE',
      grade: 3,
      subject: 'Mathematics',
      topicName: 'Mathematics - Complete Syllabus',
      syllabusSection: 'Full Syllabus',
      officialContent: 'CBSE Class 3 Maths Syllabus 2025-26 - Numbers, Operations, Shapes, and Measurements',
      learningObjectives: JSON.stringify([
        'Numbers up to 1000',
        'Addition and Subtraction',
        'Multiplication and Division',
        'Shapes and Patterns',
        'Measurement'
      ]),
    },
  });

  // CBSE Class 4 Maths
  const cbse4Maths = await prisma.syllabusTopic.create({
    data: {
      curriculum: 'CBSE',
      grade: 4,
      subject: 'Mathematics',
      topicName: 'Mathematics - Complete Syllabus',
      syllabusSection: 'Full Syllabus',
      officialContent: 'CBSE Class 4 Maths Syllabus 2025-26 - Advanced Numbers, Fractions, Geometry',
      learningObjectives: JSON.stringify([
        'Numbers up to 10000',
        'Fractions',
        'Decimals',
        'Geometry',
        'Data Handling'
      ]),
    },
  });

  // CBSE Class 4 English
  const cbse4English = await prisma.syllabusTopic.create({
    data: {
      curriculum: 'CBSE',
      grade: 4,
      subject: 'English',
      topicName: 'English - Complete Syllabus',
      syllabusSection: 'Full Syllabus',
      officialContent: 'CBSE Class 4 English Syllabus 2025-26 - Advanced Reading, Writing, and Grammar',
      learningObjectives: JSON.stringify([
        'Advanced reading comprehension',
        'Essay writing',
        'Grammar and punctuation',
        'Vocabulary expansion',
        'Story writing'
      ]),
    },
  });

  console.log('✅ Created 4 main syllabus topics');
  console.log(`  - CBSE Grade 3 English`);
  console.log(`  - CBSE Grade 3 Mathematics`);
  console.log(`  - CBSE Grade 4 Mathematics`);
  console.log(`  - CBSE Grade 4 English`);
  console.log('\nTopics are now available for test generation!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
