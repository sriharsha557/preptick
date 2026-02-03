// Seed script for CBSE Mathematics and English topics (Classes 1-10)
// Run with: npx ts-node prisma/seed-cbse-topics.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// CBSE Mathematics Topics by Grade
const mathTopics: Record<number, string[]> = {
  1: [
    'Counting Numbers (1-100)',
    'Number Names',
    'Addition (Single Digit)',
    'Subtraction (Single Digit)',
    'Shapes (2D)',
    'Shapes (3D)',
    'Patterns',
    'Comparison (More/Less)',
    'Measurement (Length)',
    'Measurement (Weight)',
    'Time (Days and Months)',
    'Money (Coins)',
  ],
  2: [
    'Numbers up to 1000',
    'Place Value (Ones, Tens, Hundreds)',
    'Addition (Two Digits)',
    'Subtraction (Two Digits)',
    'Multiplication Tables (2-5)',
    'Division Basics',
    'Fractions (Half, Quarter)',
    'Shapes and Patterns',
    'Measurement (Length - cm, m)',
    'Measurement (Weight - kg, g)',
    'Time (Hours and Minutes)',
    'Money (Notes and Coins)',
    'Data Handling (Pictographs)',
  ],
  3: [
    'Numbers up to 10000',
    'Place Value (Thousands)',
    'Addition (Three Digits)',
    'Subtraction (Three Digits)',
    'Multiplication (2-digit by 1-digit)',
    'Division (Simple)',
    'Fractions (Like Fractions)',
    'Geometry (Angles)',
    'Perimeter',
    'Measurement (Length, Weight, Capacity)',
    'Time (Calendar)',
    'Money (Bills and Change)',
    'Patterns and Symmetry',
    'Data Handling (Bar Graphs)',
  ],
  4: [
    'Numbers up to 100000',
    'Roman Numerals',
    'Addition and Subtraction (Large Numbers)',
    'Multiplication (2-digit by 2-digit)',
    'Division (2-digit divisor)',
    'Factors and Multiples',
    'Fractions (Unlike Fractions)',
    'Decimals Introduction',
    'Geometry (Lines and Angles)',
    'Area and Perimeter',
    'Measurement Conversions',
    'Time (Duration)',
    'Money (Profit and Loss basics)',
    'Patterns',
    'Data Handling',
  ],
  5: [
    'Large Numbers (Lakhs and Crores)',
    'Roman Numerals (Advanced)',
    'Operations on Large Numbers',
    'HCF and LCM',
    'Fractions (Operations)',
    'Decimals (Operations)',
    'Percentage Introduction',
    'Geometry (Triangles)',
    'Area (Rectangle, Square)',
    'Volume Introduction',
    'Measurement (All Units)',
    'Time and Distance',
    'Money (Simple Interest basics)',
    'Data Handling (Average)',
    'Patterns and Sequences',
  ],
  6: [
    'Knowing Our Numbers',
    'Whole Numbers',
    'Playing with Numbers',
    'Basic Geometrical Ideas',
    'Understanding Elementary Shapes',
    'Integers',
    'Fractions',
    'Decimals',
    'Data Handling',
    'Mensuration',
    'Algebra Introduction',
    'Ratio and Proportion',
    'Symmetry',
    'Practical Geometry',
  ],
  7: [
    'Integers',
    'Fractions and Decimals',
    'Data Handling',
    'Simple Equations',
    'Lines and Angles',
    'The Triangle and Its Properties',
    'Congruence of Triangles',
    'Comparing Quantities',
    'Rational Numbers',
    'Practical Geometry',
    'Perimeter and Area',
    'Algebraic Expressions',
    'Exponents and Powers',
    'Symmetry',
    'Visualising Solid Shapes',
  ],
  8: [
    'Rational Numbers',
    'Linear Equations in One Variable',
    'Understanding Quadrilaterals',
    'Practical Geometry',
    'Data Handling',
    'Squares and Square Roots',
    'Cubes and Cube Roots',
    'Comparing Quantities',
    'Algebraic Expressions and Identities',
    'Visualising Solid Shapes',
    'Mensuration',
    'Exponents and Powers',
    'Direct and Inverse Proportions',
    'Factorisation',
    'Introduction to Graphs',
    'Playing with Numbers',
  ],
  9: [
    'Number Systems',
    'Polynomials',
    'Coordinate Geometry',
    'Linear Equations in Two Variables',
    'Introduction to Euclid\'s Geometry',
    'Lines and Angles',
    'Triangles',
    'Quadrilaterals',
    'Areas of Parallelograms and Triangles',
    'Circles',
    'Constructions',
    'Heron\'s Formula',
    'Surface Areas and Volumes',
    'Statistics',
    'Probability',
  ],
  10: [
    'Real Numbers',
    'Polynomials',
    'Pair of Linear Equations in Two Variables',
    'Quadratic Equations',
    'Arithmetic Progressions',
    'Triangles',
    'Coordinate Geometry',
    'Introduction to Trigonometry',
    'Some Applications of Trigonometry',
    'Circles',
    'Constructions',
    'Areas Related to Circles',
    'Surface Areas and Volumes',
    'Statistics',
    'Probability',
  ],
};

// CBSE English Topics by Grade
const englishTopics: Record<number, string[]> = {
  1: [
    'Alphabet Recognition',
    'Phonics (Letter Sounds)',
    'Simple Words',
    'Sight Words',
    'Picture Reading',
    'Simple Sentences',
    'Rhymes and Poems',
    'Story Listening',
    'Basic Vocabulary',
    'Greetings and Introductions',
    'Action Words',
    'Naming Words',
  ],
  2: [
    'Phonics (Blends)',
    'Reading Simple Stories',
    'Sentence Formation',
    'Nouns (Common and Proper)',
    'Pronouns Introduction',
    'Verbs (Action Words)',
    'Adjectives Introduction',
    'Punctuation (Full Stop, Question Mark)',
    'Rhymes and Poems',
    'Picture Composition',
    'Vocabulary Building',
    'Listening Comprehension',
  ],
  3: [
    'Reading Comprehension',
    'Paragraph Writing',
    'Nouns (Singular and Plural)',
    'Pronouns',
    'Verbs (Tenses Introduction)',
    'Adjectives',
    'Articles (A, An, The)',
    'Prepositions',
    'Punctuation',
    'Rhymes and Poems',
    'Story Writing',
    'Letter Writing (Informal)',
    'Vocabulary and Spellings',
  ],
  4: [
    'Reading Comprehension',
    'Creative Writing',
    'Nouns (Countable and Uncountable)',
    'Pronouns (All Types)',
    'Verbs (Present, Past, Future)',
    'Adjectives (Degrees)',
    'Adverbs',
    'Prepositions',
    'Conjunctions',
    'Punctuation (Advanced)',
    'Essay Writing',
    'Letter Writing',
    'Poems and Prose',
    'Vocabulary Enhancement',
  ],
  5: [
    'Reading Comprehension (Advanced)',
    'Essay Writing',
    'Nouns (Abstract and Collective)',
    'Pronouns (Reflexive)',
    'Tenses (All Forms)',
    'Active and Passive Voice',
    'Direct and Indirect Speech',
    'Adjectives and Adverbs',
    'Prepositions and Conjunctions',
    'Subject-Verb Agreement',
    'Letter Writing (Formal and Informal)',
    'Story Writing',
    'Poems Analysis',
    'Vocabulary and Idioms',
  ],
  6: [
    'Prose - Who Did Patrick\'s Homework',
    'Prose - How the Dog Found Himself a New Master',
    'Prose - Taro\'s Reward',
    'Prose - An Indian-American Woman in Space',
    'Prose - A Different Kind of School',
    'Prose - Who I Am',
    'Prose - Fair Play',
    'Prose - The Banyan Tree',
    'Poetry Section',
    'Grammar - Nouns and Pronouns',
    'Grammar - Tenses',
    'Grammar - Active and Passive Voice',
    'Writing - Letter Writing',
    'Writing - Essay Writing',
    'Reading Comprehension',
  ],
  7: [
    'Prose - Three Questions',
    'Prose - A Gift of Chappals',
    'Prose - Gopal and the Hilsa Fish',
    'Prose - The Ashes That Made Trees Bloom',
    'Prose - Quality',
    'Prose - Expert Detectives',
    'Prose - The Invention of Vita-Wonk',
    'Poetry Section',
    'Grammar - Determiners',
    'Grammar - Modals',
    'Grammar - Tenses (Advanced)',
    'Grammar - Clauses',
    'Writing - Diary Entry',
    'Writing - Article Writing',
    'Reading Comprehension',
  ],
  8: [
    'Prose - The Best Christmas Present',
    'Prose - The Tsunami',
    'Prose - Glimpses of the Past',
    'Prose - Bepin Choudhury\'s Lapse of Memory',
    'Prose - The Summit Within',
    'Prose - This is Jody\'s Fawn',
    'Prose - A Visit to Cambridge',
    'Poetry Section',
    'Grammar - Tenses Revision',
    'Grammar - Reported Speech',
    'Grammar - Active and Passive Voice',
    'Grammar - Conditionals',
    'Writing - Formal Letters',
    'Writing - Report Writing',
    'Reading Comprehension',
  ],
  9: [
    'Prose - The Fun They Had',
    'Prose - The Sound of Music',
    'Prose - The Little Girl',
    'Prose - A Truly Beautiful Mind',
    'Prose - The Snake and the Mirror',
    'Prose - My Childhood',
    'Prose - Reach for the Top',
    'Prose - Kathmandu',
    'Prose - If I Were You',
    'Poetry Section',
    'Grammar - Tenses',
    'Grammar - Modals',
    'Grammar - Subject-Verb Concord',
    'Grammar - Reported Speech',
    'Grammar - Determiners',
    'Writing - Letter Writing',
    'Writing - Article Writing',
    'Writing - Story Writing',
    'Reading Comprehension',
  ],
  10: [
    'Prose - A Letter to God',
    'Prose - Nelson Mandela: Long Walk to Freedom',
    'Prose - Two Stories about Flying',
    'Prose - From the Diary of Anne Frank',
    'Prose - The Hundred Dresses',
    'Prose - Glimpses of India',
    'Prose - Mijbil the Otter',
    'Prose - Madam Rides the Bus',
    'Prose - The Sermon at Benares',
    'Prose - The Proposal',
    'Poetry Section',
    'Grammar - Tenses',
    'Grammar - Modals',
    'Grammar - Subject-Verb Concord',
    'Grammar - Reported Speech',
    'Grammar - Determiners',
    'Writing - Formal Letters',
    'Writing - Analytical Paragraph',
    'Writing - Descriptive Paragraph',
    'Reading Comprehension',
  ],
};

async function seedTopics() {
  console.log('Starting to seed CBSE topics...\n');

  let totalCreated = 0;

  // Seed Mathematics topics
  console.log('Seeding Mathematics topics...');
  for (let grade = 1; grade <= 10; grade++) {
    const topics = mathTopics[grade];
    console.log(`  Grade ${grade}: ${topics.length} topics`);

    for (const topicName of topics) {
      try {
        // Check if topic already exists
        const existing = await prisma.syllabusTopic.findFirst({
          where: {
            curriculum: 'CBSE',
            grade: grade,
            subject: 'Mathematics',
            topicName: topicName,
          },
        });

        if (!existing) {
          await prisma.syllabusTopic.create({
            data: {
              curriculum: 'CBSE',
              grade: grade,
              subject: 'Mathematics',
              topicName: topicName,
              syllabusSection: `CBSE Class ${grade} Mathematics`,
              officialContent: `Official CBSE curriculum content for ${topicName}`,
              learningObjectives: JSON.stringify([
                `Understand the concepts of ${topicName}`,
                `Apply ${topicName} to solve problems`,
                `Practice ${topicName} through exercises`,
              ]),
            },
          });
          totalCreated++;
        }
      } catch (error) {
        console.error(`    Error creating topic "${topicName}":`, error);
      }
    }
  }

  console.log('\nSeeding English topics...');
  for (let grade = 1; grade <= 10; grade++) {
    const topics = englishTopics[grade];
    console.log(`  Grade ${grade}: ${topics.length} topics`);

    for (const topicName of topics) {
      try {
        // Check if topic already exists
        const existing = await prisma.syllabusTopic.findFirst({
          where: {
            curriculum: 'CBSE',
            grade: grade,
            subject: 'English',
            topicName: topicName,
          },
        });

        if (!existing) {
          await prisma.syllabusTopic.create({
            data: {
              curriculum: 'CBSE',
              grade: grade,
              subject: 'English',
              topicName: topicName,
              syllabusSection: `CBSE Class ${grade} English`,
              officialContent: `Official CBSE curriculum content for ${topicName}`,
              learningObjectives: JSON.stringify([
                `Understand the concepts of ${topicName}`,
                `Apply knowledge of ${topicName}`,
                `Practice ${topicName} through exercises`,
              ]),
            },
          });
          totalCreated++;
        }
      } catch (error) {
        console.error(`    Error creating topic "${topicName}":`, error);
      }
    }
  }

  console.log(`\n✅ Seeding complete! Created ${totalCreated} new topics.`);

  // Print summary
  const mathCount = await prisma.syllabusTopic.count({
    where: { curriculum: 'CBSE', subject: 'Mathematics' },
  });
  const englishCount = await prisma.syllabusTopic.count({
    where: { curriculum: 'CBSE', subject: 'English' },
  });

  console.log(`\nDatabase Summary:`);
  console.log(`  - CBSE Mathematics topics: ${mathCount}`);
  console.log(`  - CBSE English topics: ${englishCount}`);
  console.log(`  - Total CBSE topics: ${mathCount + englishCount}`);
}

// Run the seed function
seedTopics()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
