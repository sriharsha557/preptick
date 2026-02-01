// Database seed script for MockPrep syllabus topics

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Type for topic data with optional parent reference
type TopicData = {
  curriculum: string;
  grade: number;
  subject: string;
  topicName: string;
  syllabusSection: string;
  officialContent: string;
  learningObjectives: string[];
  parentTopicName?: string; // Reference to parent by name
};

// Helper function to create topics with hierarchy
async function createTopicsWithHierarchy(topics: TopicData[]) {
  const createdTopics = new Map<string, string>(); // Map of topicName -> id

  // First pass: create all topics without parent relationships
  for (const topic of topics) {
    const key = `${topic.curriculum}-${topic.grade}-${topic.subject}-${topic.topicName}`;
    
    const created = await prisma.syllabusTopic.create({
      data: {
        curriculum: topic.curriculum,
        grade: topic.grade,
        subject: topic.subject,
        topicName: topic.topicName,
        syllabusSection: topic.syllabusSection,
        officialContent: topic.officialContent,
        learningObjectives: JSON.stringify(topic.learningObjectives),
      },
    });
    
    createdTopics.set(key, created.id);
  }

  // Second pass: update parent relationships
  for (const topic of topics) {
    if (topic.parentTopicName) {
      const key = `${topic.curriculum}-${topic.grade}-${topic.subject}-${topic.topicName}`;
      const parentKey = `${topic.curriculum}-${topic.grade}-${topic.subject}-${topic.parentTopicName}`;
      
      const topicId = createdTopics.get(key);
      const parentId = createdTopics.get(parentKey);
      
      if (topicId && parentId) {
        await prisma.syllabusTopic.update({
          where: { id: topicId },
          data: { parentTopicId: parentId },
        });
      }
    }
  }
}

async function main() {
  console.log('Starting database seed...');

  // Clear existing data (in correct order due to foreign keys)
  console.log('Clearing existing questions...');
  await prisma.question.deleteMany({});
  console.log('Clearing existing syllabus topics...');
  await prisma.syllabusTopic.deleteMany({});

  // CBSE Curriculum Topics
  const cbseTopics: TopicData[] = [
    // CBSE Mathematics - Grades 1-10
    // Grade 1
    {
      curriculum: 'CBSE',
      grade: 1,
      subject: 'Mathematics',
      topicName: 'Numbers up to 100',
      syllabusSection: 'Chapter 1',
      officialContent: 'Counting, reading, and writing numbers from 1 to 100',
      learningObjectives: ['Count objects up to 100', 'Read and write numbers', 'Compare numbers'],
    },
    {
      curriculum: 'CBSE',
      grade: 1,
      subject: 'Mathematics',
      topicName: 'Addition and Subtraction',
      syllabusSection: 'Chapter 2',
      officialContent: 'Basic addition and subtraction within 20',
      learningObjectives: ['Add numbers within 20', 'Subtract numbers within 20', 'Solve word problems'],
    },
    {
      curriculum: 'CBSE',
      grade: 1,
      subject: 'Mathematics',
      topicName: 'Shapes and Patterns',
      syllabusSection: 'Chapter 3',
      officialContent: 'Identifying basic 2D shapes and simple patterns',
      learningObjectives: ['Identify circles, squares, triangles', 'Recognize patterns', 'Draw shapes'],
    },

    // Grade 5
    {
      curriculum: 'CBSE',
      grade: 5,
      subject: 'Mathematics',
      topicName: 'Numbers',
      syllabusSection: 'Chapter 1',
      officialContent: 'Understanding place value, comparing numbers, and operations',
      learningObjectives: ['Read and write numbers up to 8 digits', 'Compare and order numbers', 'Perform addition and subtraction'],
    },
    {
      curriculum: 'CBSE',
      grade: 5,
      subject: 'Mathematics',
      topicName: 'Place Value',
      syllabusSection: 'Chapter 1.1',
      officialContent: 'Understanding place value in large numbers',
      learningObjectives: ['Identify place value', 'Expand numbers', 'Compare using place value'],
      parentTopicName: 'Numbers',
    },
    {
      curriculum: 'CBSE',
      grade: 5,
      subject: 'Mathematics',
      topicName: 'Fractions',
      syllabusSection: 'Chapter 2',
      officialContent: 'Understanding fractions, equivalent fractions, and operations',
      learningObjectives: ['Identify and represent fractions', 'Find equivalent fractions', 'Add and subtract fractions'],
    },
    {
      curriculum: 'CBSE',
      grade: 5,
      subject: 'Mathematics',
      topicName: 'Geometry',
      syllabusSection: 'Chapter 3',
      officialContent: 'Understanding shapes, angles, and basic geometric concepts',
      learningObjectives: ['Identify 2D and 3D shapes', 'Measure angles', 'Calculate perimeter and area'],
    },
    {
      curriculum: 'CBSE',
      grade: 5,
      subject: 'Mathematics',
      topicName: 'Decimals',
      syllabusSection: 'Chapter 4',
      officialContent: 'Introduction to decimal numbers and operations',
      learningObjectives: ['Understand decimal notation', 'Compare decimals', 'Add and subtract decimals'],
    },

    // Grade 10
    {
      curriculum: 'CBSE',
      grade: 10,
      subject: 'Mathematics',
      topicName: 'Real Numbers',
      syllabusSection: 'Chapter 1',
      officialContent: 'Euclid\'s division lemma, fundamental theorem of arithmetic, rational and irrational numbers',
      learningObjectives: ['Apply Euclid\'s division algorithm', 'Find HCF and LCM', 'Prove irrationality'],
    },
    {
      curriculum: 'CBSE',
      grade: 10,
      subject: 'Mathematics',
      topicName: 'Polynomials',
      syllabusSection: 'Chapter 2',
      officialContent: 'Zeros of polynomial, relationship between zeros and coefficients',
      learningObjectives: ['Find zeros of polynomials', 'Verify relationships', 'Divide polynomials'],
    },
    {
      curriculum: 'CBSE',
      grade: 10,
      subject: 'Mathematics',
      topicName: 'Quadratic Equations',
      syllabusSection: 'Chapter 4',
      officialContent: 'Standard form, solution by factorization, completing the square, and quadratic formula',
      learningObjectives: ['Solve by factorization', 'Use quadratic formula', 'Apply to word problems'],
    },
    {
      curriculum: 'CBSE',
      grade: 10,
      subject: 'Mathematics',
      topicName: 'Trigonometry',
      syllabusSection: 'Chapter 8',
      officialContent: 'Trigonometric ratios, identities, and applications',
      learningObjectives: ['Calculate trigonometric ratios', 'Prove identities', 'Solve height and distance problems'],
    },

    // CBSE Science
    // Grade 5
    {
      curriculum: 'CBSE',
      grade: 5,
      subject: 'Science',
      topicName: 'Living and Non-living Things',
      syllabusSection: 'Chapter 1',
      officialContent: 'Characteristics of living things and classification',
      learningObjectives: ['Distinguish living from non-living', 'Identify characteristics of life', 'Classify organisms'],
    },
    {
      curriculum: 'CBSE',
      grade: 5,
      subject: 'Science',
      topicName: 'Plants',
      syllabusSection: 'Chapter 2',
      officialContent: 'Parts of plants, photosynthesis, and plant life cycle',
      learningObjectives: ['Identify plant parts', 'Understand photosynthesis', 'Describe plant reproduction'],
    },
    {
      curriculum: 'CBSE',
      grade: 5,
      subject: 'Science',
      topicName: 'Animals',
      syllabusSection: 'Chapter 3',
      officialContent: 'Animal classification, habitats, and adaptations',
      learningObjectives: ['Classify animals', 'Identify habitats', 'Understand adaptations'],
    },

    // Grade 10
    {
      curriculum: 'CBSE',
      grade: 10,
      subject: 'Science',
      topicName: 'Chemical Reactions',
      syllabusSection: 'Chapter 1',
      officialContent: 'Types of chemical reactions, balancing equations, and oxidation-reduction',
      learningObjectives: ['Balance chemical equations', 'Identify reaction types', 'Understand redox reactions'],
    },
    {
      curriculum: 'CBSE',
      grade: 10,
      subject: 'Science',
      topicName: 'Life Processes',
      syllabusSection: 'Chapter 6',
      officialContent: 'Nutrition, respiration, transportation, and excretion in living organisms',
      learningObjectives: ['Explain nutrition in plants and animals', 'Describe respiration', 'Understand circulatory system'],
    },
    {
      curriculum: 'CBSE',
      grade: 10,
      subject: 'Science',
      topicName: 'Electricity',
      syllabusSection: 'Chapter 12',
      officialContent: 'Electric current, potential difference, Ohm\'s law, and electric circuits',
      learningObjectives: ['Apply Ohm\'s law', 'Calculate resistance', 'Analyze series and parallel circuits'],
    },

    // CBSE English
    {
      curriculum: 'CBSE',
      grade: 5,
      subject: 'English',
      topicName: 'Reading Comprehension',
      syllabusSection: 'Unit 1',
      officialContent: 'Understanding passages, answering questions, and vocabulary',
      learningObjectives: ['Read and understand passages', 'Answer comprehension questions', 'Learn new vocabulary'],
    },
    {
      curriculum: 'CBSE',
      grade: 5,
      subject: 'English',
      topicName: 'Grammar',
      syllabusSection: 'Unit 2',
      officialContent: 'Parts of speech, tenses, and sentence structure',
      learningObjectives: ['Identify parts of speech', 'Use correct tenses', 'Form proper sentences'],
    },
    {
      curriculum: 'CBSE',
      grade: 10,
      subject: 'English',
      topicName: 'Literature',
      syllabusSection: 'Unit 1',
      officialContent: 'Analysis of prose, poetry, and drama',
      learningObjectives: ['Analyze literary texts', 'Identify themes and characters', 'Interpret figurative language'],
    },
  ];

  // Cambridge Curriculum Topics
  const cambridgeTopics: TopicData[] = [
    // Cambridge Mathematics
    // Grade 1
    {
      curriculum: 'Cambridge',
      grade: 1,
      subject: 'Mathematics',
      topicName: 'Number',
      syllabusSection: 'Stage 1',
      officialContent: 'Counting, ordering, and understanding numbers to 20',
      learningObjectives: ['Count reliably to 20', 'Order numbers', 'Recognize number patterns'],
    },
    {
      curriculum: 'Cambridge',
      grade: 1,
      subject: 'Mathematics',
      topicName: 'Geometry',
      syllabusSection: 'Stage 1',
      officialContent: 'Recognizing and naming 2D and 3D shapes',
      learningObjectives: ['Name common shapes', 'Describe shape properties', 'Sort shapes'],
    },

    // Grade 5
    {
      curriculum: 'Cambridge',
      grade: 5,
      subject: 'Mathematics',
      topicName: 'Number',
      syllabusSection: 'Stage 5',
      officialContent: 'Place value, ordering, rounding, and operations with whole numbers and decimals',
      learningObjectives: ['Understand place value to millions', 'Round numbers', 'Perform operations with decimals'],
    },
    {
      curriculum: 'Cambridge',
      grade: 5,
      subject: 'Mathematics',
      topicName: 'Fractions and Decimals',
      syllabusSection: 'Stage 5',
      officialContent: 'Understanding fractions, decimals, and their relationships',
      learningObjectives: ['Convert between fractions and decimals', 'Compare fractions', 'Perform operations'],
    },
    {
      curriculum: 'Cambridge',
      grade: 5,
      subject: 'Mathematics',
      topicName: 'Measurement',
      syllabusSection: 'Stage 5',
      officialContent: 'Length, mass, capacity, time, and area',
      learningObjectives: ['Measure accurately', 'Convert units', 'Calculate area and perimeter'],
    },
    {
      curriculum: 'Cambridge',
      grade: 5,
      subject: 'Mathematics',
      topicName: 'Geometry',
      syllabusSection: 'Stage 5',
      officialContent: 'Properties of shapes, angles, and symmetry',
      learningObjectives: ['Classify shapes', 'Measure angles', 'Identify lines of symmetry'],
    },

    // Grade 10
    {
      curriculum: 'Cambridge',
      grade: 10,
      subject: 'Mathematics',
      topicName: 'Algebra',
      syllabusSection: 'IGCSE Core',
      officialContent: 'Algebraic expressions, equations, inequalities, and sequences',
      learningObjectives: ['Simplify expressions', 'Solve equations', 'Work with sequences'],
    },
    {
      curriculum: 'Cambridge',
      grade: 10,
      subject: 'Mathematics',
      topicName: 'Functions',
      syllabusSection: 'IGCSE Core',
      officialContent: 'Linear, quadratic, and other functions',
      learningObjectives: ['Plot graphs', 'Find gradients', 'Solve simultaneous equations graphically'],
    },
    {
      curriculum: 'Cambridge',
      grade: 10,
      subject: 'Mathematics',
      topicName: 'Geometry and Trigonometry',
      syllabusSection: 'IGCSE Core',
      officialContent: 'Angles, triangles, circles, and basic trigonometry',
      learningObjectives: ['Apply angle properties', 'Use Pythagoras theorem', 'Calculate using trigonometric ratios'],
    },

    // Cambridge Science
    // Grade 5
    {
      curriculum: 'Cambridge',
      grade: 5,
      subject: 'Science',
      topicName: 'Living Things',
      syllabusSection: 'Stage 5',
      officialContent: 'Classification of living organisms and their characteristics',
      learningObjectives: ['Classify living things into groups', 'Understand life processes', 'Identify habitats and adaptations'],
    },
    {
      curriculum: 'Cambridge',
      grade: 5,
      subject: 'Science',
      topicName: 'Forces and Motion',
      syllabusSection: 'Stage 5',
      officialContent: 'Understanding forces, friction, and motion',
      learningObjectives: ['Identify different types of forces', 'Understand friction and its effects', 'Measure and compare speeds'],
    },
    {
      curriculum: 'Cambridge',
      grade: 5,
      subject: 'Science',
      topicName: 'Materials',
      syllabusSection: 'Stage 5',
      officialContent: 'Properties of materials and changes of state',
      learningObjectives: ['Classify materials', 'Understand reversible and irreversible changes', 'Investigate dissolving'],
    },

    // Grade 10
    {
      curriculum: 'Cambridge',
      grade: 10,
      subject: 'Science',
      topicName: 'Biology - Cells',
      syllabusSection: 'IGCSE',
      officialContent: 'Cell structure, organization, and specialized cells',
      learningObjectives: ['Identify cell structures', 'Understand cell functions', 'Compare plant and animal cells'],
    },
    {
      curriculum: 'Cambridge',
      grade: 10,
      subject: 'Science',
      topicName: 'Chemistry - Atoms and Elements',
      syllabusSection: 'IGCSE',
      officialContent: 'Atomic structure, periodic table, and chemical bonding',
      learningObjectives: ['Describe atomic structure', 'Use the periodic table', 'Explain chemical bonding'],
    },
    {
      curriculum: 'Cambridge',
      grade: 10,
      subject: 'Science',
      topicName: 'Physics - Forces and Motion',
      syllabusSection: 'IGCSE',
      officialContent: 'Speed, velocity, acceleration, and Newton\'s laws',
      learningObjectives: ['Calculate speed and acceleration', 'Apply Newton\'s laws', 'Understand momentum'],
    },

    // Cambridge English
    {
      curriculum: 'Cambridge',
      grade: 5,
      subject: 'English',
      topicName: 'Reading',
      syllabusSection: 'Stage 5',
      officialContent: 'Reading comprehension, inference, and analysis',
      learningObjectives: ['Read with understanding', 'Make inferences', 'Analyze text structure'],
    },
    {
      curriculum: 'Cambridge',
      grade: 5,
      subject: 'English',
      topicName: 'Writing',
      syllabusSection: 'Stage 5',
      officialContent: 'Creative and informative writing',
      learningObjectives: ['Write narratives', 'Write reports', 'Use descriptive language'],
    },
    {
      curriculum: 'Cambridge',
      grade: 10,
      subject: 'English',
      topicName: 'Literature',
      syllabusSection: 'IGCSE',
      officialContent: 'Analysis of prose, poetry, and drama from different cultures',
      learningObjectives: ['Analyze literary techniques', 'Compare texts', 'Write critical essays'],
    },
  ];

  console.log('Seeding CBSE topics...');
  await createTopicsWithHierarchy(cbseTopics);
  console.log(`Created ${cbseTopics.length} CBSE topics`);

  console.log('Seeding Cambridge topics...');
  await createTopicsWithHierarchy(cambridgeTopics);
  console.log(`Created ${cambridgeTopics.length} Cambridge topics`);

  // Count and display summary
  const totalTopics = await prisma.syllabusTopic.count();
  const cbseCount = await prisma.syllabusTopic.count({ where: { curriculum: 'CBSE' } });
  const cambridgeCount = await prisma.syllabusTopic.count({ where: { curriculum: 'Cambridge' } });

  console.log('\n=== Seed Summary ===');
  console.log(`Total topics: ${totalTopics}`);
  console.log(`CBSE topics: ${cbseCount}`);
  console.log(`Cambridge topics: ${cambridgeCount}`);
  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
