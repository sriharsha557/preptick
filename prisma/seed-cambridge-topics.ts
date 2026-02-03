// Seed script for Cambridge Mathematics and English topics (Classes 1-10)
// Run with: npx tsx prisma/seed-cambridge-topics.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Cambridge Primary/Lower Secondary Mathematics Topics by Grade
// Based on Cambridge Primary (Stages 1-6) and Lower Secondary (Stages 7-9) curriculum
const cambridgeMathTopics: Record<number, string[]> = {
  1: [
    'Counting and Numbers (0-20)',
    'Reading and Writing Numbers',
    'Comparing and Ordering Numbers',
    'Addition Facts (within 10)',
    'Subtraction Facts (within 10)',
    'Number Patterns',
    '2D Shapes Recognition',
    '3D Shapes Recognition',
    'Position and Direction',
    'Length and Height Comparison',
    'Mass Comparison',
    'Capacity Comparison',
    'Time (Days, Sequences)',
    'Sorting and Classifying',
  ],
  2: [
    'Numbers to 100',
    'Place Value (Tens and Ones)',
    'Addition (Two-digit numbers)',
    'Subtraction (Two-digit numbers)',
    'Multiplication (2, 5, 10 times tables)',
    'Division (Sharing equally)',
    'Fractions (Halves and Quarters)',
    'Money (Coins and Notes)',
    '2D and 3D Shapes Properties',
    'Symmetry',
    'Position and Movement',
    'Length (cm and m)',
    'Mass (g and kg)',
    'Capacity (ml and l)',
    'Time (Hours and Half hours)',
    'Handling Data (Pictograms)',
  ],
  3: [
    'Numbers to 1000',
    'Place Value (Hundreds, Tens, Ones)',
    'Addition and Subtraction Strategies',
    'Multiplication Facts (2-10)',
    'Division with Remainders',
    'Fractions (Unit fractions)',
    'Equivalent Fractions',
    'Decimals Introduction',
    'Money Calculations',
    'Properties of 2D Shapes',
    'Properties of 3D Shapes',
    'Angles (Right angles)',
    'Perimeter',
    'Length, Mass, Capacity',
    'Time (Minutes, Calendar)',
    'Bar Charts and Tables',
  ],
  4: [
    'Numbers to 10000',
    'Place Value and Ordering',
    'Addition and Subtraction (4-digit)',
    'Multiplication (2-digit by 1-digit)',
    'Division (2-digit by 1-digit)',
    'Factors and Multiples',
    'Fractions (Adding and Subtracting)',
    'Decimals (Tenths and Hundredths)',
    'Percentages Introduction',
    'Coordinates',
    'Angles (Acute, Obtuse, Reflex)',
    'Triangles and Quadrilaterals',
    'Area (Counting squares)',
    'Perimeter Calculations',
    'Time (24-hour clock)',
    'Data Handling (Venn diagrams)',
  ],
  5: [
    'Numbers to 1000000',
    'Negative Numbers',
    'Prime Numbers',
    'Square Numbers',
    'Order of Operations',
    'Fractions (Multiplying)',
    'Decimals (Operations)',
    'Percentages (of amounts)',
    'Ratio Introduction',
    'Coordinates (Four quadrants)',
    'Angles (Measuring and Drawing)',
    'Properties of Polygons',
    'Area (Rectangles, Triangles)',
    'Volume Introduction',
    'Converting Units',
    'Mean, Mode, Median, Range',
    'Probability Introduction',
  ],
  6: [
    'Integers and Powers',
    'Factors, Multiples, Primes',
    'Fractions, Decimals, Percentages',
    'Ratio and Proportion',
    'Order of Operations (BODMAS)',
    'Algebraic Expressions',
    'Formulae and Substitution',
    'Sequences',
    'Coordinates and Graphs',
    'Angles in Shapes',
    'Transformations (Reflection, Rotation)',
    'Area and Perimeter',
    'Volume and Surface Area',
    'Units of Measurement',
    'Statistical Measures',
    'Probability Calculations',
  ],
  7: [
    'Integers (Operations)',
    'Powers and Roots',
    'Fractions and Percentages',
    'Ratio and Rate',
    'Algebraic Expressions',
    'Linear Equations',
    'Sequences and Functions',
    'Straight Line Graphs',
    'Angles and Parallel Lines',
    'Triangles and Quadrilaterals',
    'Transformations',
    'Constructions',
    'Area, Perimeter, Volume',
    'Compound Units',
    'Collecting and Displaying Data',
    'Averages and Range',
    'Probability',
  ],
  8: [
    'Number Properties',
    'Fractions, Decimals, Percentages',
    'Ratio, Proportion, Rate',
    'Indices and Standard Form',
    'Expanding and Factorising',
    'Linear Equations and Inequalities',
    'Simultaneous Equations',
    'Straight Line Graphs',
    'Real-life Graphs',
    'Pythagoras Theorem',
    'Angle Properties',
    'Similarity and Congruence',
    'Transformations',
    'Area and Volume',
    'Compound Measures',
    'Statistical Diagrams',
    'Probability Calculations',
  ],
  9: [
    'Number and Calculation',
    'Indices and Surds',
    'Algebraic Manipulation',
    'Quadratic Expressions',
    'Solving Equations',
    'Inequalities',
    'Functions and Graphs',
    'Sequences',
    'Trigonometry',
    'Pythagoras and Trigonometry',
    'Similarity',
    'Circle Theorems',
    'Vectors Introduction',
    'Constructions and Loci',
    'Mensuration',
    'Statistics',
    'Probability',
  ],
  10: [
    'Number and Algebra Review',
    'Advanced Indices',
    'Surds',
    'Quadratic Equations',
    'Algebraic Fractions',
    'Linear and Quadratic Graphs',
    'Functions',
    'Trigonometry (Sine, Cosine rules)',
    'Circle Theorems',
    'Vectors',
    'Transformations',
    'Similarity and Congruence',
    'Mensuration (3D)',
    'Compound Measures',
    'Sets and Venn Diagrams',
    'Histograms and Cumulative Frequency',
    'Probability (Combined events)',
  ],
};

// Cambridge Primary/Lower Secondary English Topics by Grade
// Based on Cambridge Primary English and Lower Secondary English curriculum
const cambridgeEnglishTopics: Record<number, string[]> = {
  1: [
    'Phonics (Letter sounds)',
    'Blending and Segmenting',
    'High-frequency Words',
    'Reading Simple Texts',
    'Listening and Responding',
    'Speaking in Sentences',
    'Capital Letters and Full Stops',
    'Writing Simple Sentences',
    'Nouns and Verbs',
    'Stories and Rhymes',
    'Instructions',
    'Labels and Captions',
  ],
  2: [
    'Phonics (Digraphs and Blends)',
    'Reading Fluency',
    'Comprehension Skills',
    'Vocabulary Building',
    'Sentence Structure',
    'Nouns (Common and Proper)',
    'Verbs (Present Tense)',
    'Adjectives',
    'Question Marks and Exclamation Marks',
    'Writing Narratives',
    'Writing Instructions',
    'Poetry',
    'Non-fiction Texts',
  ],
  3: [
    'Reading Comprehension',
    'Inference and Prediction',
    'Vocabulary in Context',
    'Nouns (Singular and Plural)',
    'Pronouns',
    'Verbs (Past Tense)',
    'Adjectives and Adverbs',
    'Conjunctions',
    'Punctuation (Commas, Apostrophes)',
    'Narrative Writing',
    'Report Writing',
    'Letter Writing',
    'Poetry Analysis',
    'Speaking and Listening',
  ],
  4: [
    'Reading for Meaning',
    'Summarising',
    'Author\'s Purpose',
    'Noun Phrases',
    'Verb Tenses',
    'Adverbs and Adverbials',
    'Prepositions',
    'Speech Marks',
    'Paragraphing',
    'Story Writing',
    'Persuasive Writing',
    'Explanation Texts',
    'Poetry Writing',
    'Presentation Skills',
  ],
  5: [
    'Comprehension Strategies',
    'Analysing Characters',
    'Themes and Messages',
    'Formal and Informal Language',
    'Clauses (Main and Subordinate)',
    'Relative Clauses',
    'Modal Verbs',
    'Passive Voice',
    'Colons and Semi-colons',
    'Narrative Techniques',
    'Discursive Writing',
    'Biography and Autobiography',
    'Play Scripts',
    'Debate and Discussion',
  ],
  6: [
    'Critical Reading',
    'Comparing Texts',
    'Evaluating Arguments',
    'Vocabulary Development',
    'Complex Sentences',
    'Cohesion and Coherence',
    'Formal Writing',
    'Editing and Proofreading',
    'Creative Writing',
    'Argument and Persuasion',
    'Report and Article Writing',
    'Review Writing',
    'Speaking Confidently',
    'Listening for Information',
  ],
  7: [
    'Reading Fiction',
    'Reading Non-fiction',
    'Analysing Language',
    'Writer\'s Techniques',
    'Vocabulary and Spelling',
    'Grammar Review',
    'Sentence Variety',
    'Punctuation Mastery',
    'Descriptive Writing',
    'Narrative Writing',
    'Argumentative Writing',
    'Formal Letters',
    'Speaking and Presenting',
    'Listening Skills',
  ],
  8: [
    'Prose Analysis',
    'Poetry Analysis',
    'Drama Analysis',
    'Non-fiction Analysis',
    'Language Devices',
    'Structure and Form',
    'Advanced Grammar',
    'Spelling and Vocabulary',
    'Creative Writing (Fiction)',
    'Transactional Writing',
    'Essay Writing',
    'Article and Review Writing',
    'Oral Presentations',
    'Group Discussions',
  ],
  9: [
    'Analysing Prose Fiction',
    'Analysing Poetry',
    'Analysing Drama',
    'Analysing Non-fiction',
    'Language Analysis',
    'Structural Analysis',
    'Contextual Understanding',
    'Comparative Analysis',
    'Narrative Writing',
    'Descriptive Writing',
    'Argumentative Writing',
    'Discursive Writing',
    'Summary Writing',
    'Directed Writing',
    'Speaking Assessment',
    'Listening Comprehension',
  ],
  10: [
    'Literature Analysis (Prose)',
    'Literature Analysis (Poetry)',
    'Literature Analysis (Drama)',
    'Unseen Text Analysis',
    'Language and Style',
    'Themes and Context',
    'Character Analysis',
    'Comparative Essay',
    'Imaginative Writing',
    'Narrative Perspective',
    'Argumentative Essay',
    'Report Writing',
    'Speech Writing',
    'Summary and Note-making',
    'Extended Response',
    'Examination Technique',
  ],
};

async function seedCambridgeTopics() {
  console.log('Starting to seed Cambridge topics...\n');

  let totalCreated = 0;

  // Seed Mathematics topics
  console.log('Seeding Cambridge Mathematics topics...');
  for (let grade = 1; grade <= 10; grade++) {
    const topics = cambridgeMathTopics[grade];
    console.log(`  Grade ${grade}: ${topics.length} topics`);

    for (const topicName of topics) {
      try {
        // Check if topic already exists
        const existing = await prisma.syllabusTopic.findFirst({
          where: {
            curriculum: 'Cambridge',
            grade: grade,
            subject: 'Mathematics',
            topicName: topicName,
          },
        });

        if (!existing) {
          await prisma.syllabusTopic.create({
            data: {
              curriculum: 'Cambridge',
              grade: grade,
              subject: 'Mathematics',
              topicName: topicName,
              syllabusSection: `Cambridge Stage ${grade} Mathematics`,
              officialContent: `Official Cambridge curriculum content for ${topicName}`,
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

  console.log('\nSeeding Cambridge English topics...');
  for (let grade = 1; grade <= 10; grade++) {
    const topics = cambridgeEnglishTopics[grade];
    console.log(`  Grade ${grade}: ${topics.length} topics`);

    for (const topicName of topics) {
      try {
        // Check if topic already exists
        const existing = await prisma.syllabusTopic.findFirst({
          where: {
            curriculum: 'Cambridge',
            grade: grade,
            subject: 'English',
            topicName: topicName,
          },
        });

        if (!existing) {
          await prisma.syllabusTopic.create({
            data: {
              curriculum: 'Cambridge',
              grade: grade,
              subject: 'English',
              topicName: topicName,
              syllabusSection: `Cambridge Stage ${grade} English`,
              officialContent: `Official Cambridge curriculum content for ${topicName}`,
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

  console.log(`\n✅ Cambridge seeding complete! Created ${totalCreated} new topics.`);

  // Print summary
  const cambridgeMathCount = await prisma.syllabusTopic.count({
    where: { curriculum: 'Cambridge', subject: 'Mathematics' },
  });
  const cambridgeEnglishCount = await prisma.syllabusTopic.count({
    where: { curriculum: 'Cambridge', subject: 'English' },
  });
  const cbseMathCount = await prisma.syllabusTopic.count({
    where: { curriculum: 'CBSE', subject: 'Mathematics' },
  });
  const cbseEnglishCount = await prisma.syllabusTopic.count({
    where: { curriculum: 'CBSE', subject: 'English' },
  });

  console.log(`\nDatabase Summary:`);
  console.log(`  Cambridge:`);
  console.log(`    - Mathematics topics: ${cambridgeMathCount}`);
  console.log(`    - English topics: ${cambridgeEnglishCount}`);
  console.log(`    - Subtotal: ${cambridgeMathCount + cambridgeEnglishCount}`);
  console.log(`  CBSE:`);
  console.log(`    - Mathematics topics: ${cbseMathCount}`);
  console.log(`    - English topics: ${cbseEnglishCount}`);
  console.log(`    - Subtotal: ${cbseMathCount + cbseEnglishCount}`);
  console.log(`  ─────────────────────────────`);
  console.log(`  Total topics: ${cambridgeMathCount + cambridgeEnglishCount + cbseMathCount + cbseEnglishCount}`);
}

// Run the seed function
seedCambridgeTopics()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
