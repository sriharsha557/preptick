// Question bank seed data for MockPrep

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type QuestionData = {
  topicName: string;
  curriculum: string;
  grade: number;
  subject: string;
  questionText: string;
  questionType: 'MultipleChoice' | 'ShortAnswer' | 'Numerical';
  options?: string[];
  correctAnswer: string;
  syllabusReference: string;
};

/**
 * Seed questions for the question bank
 * Covers CBSE and Cambridge curricula, grades 1, 5, 10
 * Subjects: Mathematics, Science, English
 * Question types: MultipleChoice, ShortAnswer, Numerical
 */
async function seedQuestions() {
  console.log('Starting question bank seed...');

  // Get all topics from database
  const topics = await prisma.syllabusTopic.findMany();
  const topicMap = new Map(
    topics.map(t => [
      `${t.curriculum}-${t.grade}-${t.subject}-${t.topicName}`,
      t.id
    ])
  );

  // Helper function to get topic ID
  const getTopicId = (curriculum: string, grade: number, subject: string, topicName: string): string => {
    const key = `${curriculum}-${grade}-${subject}-${topicName}`;
    const id = topicMap.get(key);
    if (!id) {
      throw new Error(`Topic not found: ${key}`);
    }
    return id;
  };

  // Clear existing questions
  console.log('Clearing existing questions...');
  await prisma.question.deleteMany({});

  const questions: QuestionData[] = [
    // ===== CBSE Grade 1 Mathematics =====
    // Numbers up to 100
    {
      curriculum: 'CBSE', grade: 1, subject: 'Mathematics',
      topicName: 'Numbers up to 100',
      questionText: 'What number comes after 45?',
      questionType: 'MultipleChoice',
      options: ['44', '46', '47', '48'],
      correctAnswer: '46',
      syllabusReference: 'Chapter 1: Counting and Number Sequence'
    },
    {
      curriculum: 'CBSE', grade: 1, subject: 'Mathematics',
      topicName: 'Numbers up to 100',
      questionText: 'Write the number that comes before 30.',
      questionType: 'Numerical',
      correctAnswer: '29',
      syllabusReference: 'Chapter 1: Number Sequence'
    },
    {
      curriculum: 'CBSE', grade: 1, subject: 'Mathematics',
      topicName: 'Numbers up to 100',
      questionText: 'Which number is greater: 67 or 76?',
      questionType: 'Numerical',
      correctAnswer: '76',
      syllabusReference: 'Chapter 1: Comparing Numbers'
    },
    {
      curriculum: 'CBSE', grade: 1, subject: 'Mathematics',
      topicName: 'Numbers up to 100',
      questionText: 'Count the objects and write the number: ★★★★★★★★',
      questionType: 'Numerical',
      correctAnswer: '8',
      syllabusReference: 'Chapter 1: Counting Objects'
    },

    // Addition and Subtraction
    {
      curriculum: 'CBSE', grade: 1, subject: 'Mathematics',
      topicName: 'Addition and Subtraction',
      questionText: 'What is 7 + 5?',
      questionType: 'MultipleChoice',
      options: ['10', '11', '12', '13'],
      correctAnswer: '12',
      syllabusReference: 'Chapter 2: Addition within 20'
    },
    {
      curriculum: 'CBSE', grade: 1, subject: 'Mathematics',
      topicName: 'Addition and Subtraction',
      questionText: 'Calculate: 15 - 8',
      questionType: 'Numerical',
      correctAnswer: '7',
      syllabusReference: 'Chapter 2: Subtraction within 20'
    },
    {
      curriculum: 'CBSE', grade: 1, subject: 'Mathematics',
      topicName: 'Addition and Subtraction',
      questionText: 'Ravi has 9 apples. He gives 4 to his friend. How many apples does he have left?',
      questionType: 'Numerical',
      correctAnswer: '5',
      syllabusReference: 'Chapter 2: Word Problems'
    },

    // Shapes and Patterns
    {
      curriculum: 'CBSE', grade: 1, subject: 'Mathematics',
      topicName: 'Shapes and Patterns',
      questionText: 'How many sides does a triangle have?',
      questionType: 'MultipleChoice',
      options: ['2', '3', '4', '5'],
      correctAnswer: '3',
      syllabusReference: 'Chapter 3: Basic Shapes'
    },
    {
      curriculum: 'CBSE', grade: 1, subject: 'Mathematics',
      topicName: 'Shapes and Patterns',
      questionText: 'Which shape has 4 equal sides?',
      questionType: 'ShortAnswer',
      correctAnswer: 'square',
      syllabusReference: 'Chapter 3: Properties of Shapes'
    },
    {
      curriculum: 'CBSE', grade: 1, subject: 'Mathematics',
      topicName: 'Shapes and Patterns',
      questionText: 'Complete the pattern: 2, 4, 6, 8, __',
      questionType: 'Numerical',
      correctAnswer: '10',
      syllabusReference: 'Chapter 3: Number Patterns'
    },

    // ===== CBSE Grade 5 Mathematics =====
    // Numbers
    {
      curriculum: 'CBSE', grade: 5, subject: 'Mathematics',
      topicName: 'Numbers',
      questionText: 'What is the place value of 7 in 4,567,890?',
      questionType: 'MultipleChoice',
      options: ['7', '70', '7,000', '70,000'],
      correctAnswer: '7,000',
      syllabusReference: 'Chapter 1: Place Value'
    },
    {
      curriculum: 'CBSE', grade: 5, subject: 'Mathematics',
      topicName: 'Numbers',
      questionText: 'Write 5,234,678 in words.',
      questionType: 'ShortAnswer',
      correctAnswer: 'five million two hundred thirty-four thousand six hundred seventy-eight',
      syllabusReference: 'Chapter 1: Number Names'
    },
    {
      curriculum: 'CBSE', grade: 5, subject: 'Mathematics',
      topicName: 'Numbers',
      questionText: 'Calculate: 4,567 + 3,892',
      questionType: 'Numerical',
      correctAnswer: '8459',
      syllabusReference: 'Chapter 1: Addition of Large Numbers'
    },
    {
      curriculum: 'CBSE', grade: 5, subject: 'Mathematics',
      topicName: 'Numbers',
      questionText: 'What is the largest 6-digit number?',
      questionType: 'Numerical',
      correctAnswer: '999999',
      syllabusReference: 'Chapter 1: Number System'
    },

    // Place Value
    {
      curriculum: 'CBSE', grade: 5, subject: 'Mathematics',
      topicName: 'Place Value',
      questionText: 'In the number 8,765,432, what digit is in the hundred thousands place?',
      questionType: 'Numerical',
      correctAnswer: '7',
      syllabusReference: 'Chapter 1.1: Place Value Identification'
    },
    {
      curriculum: 'CBSE', grade: 5, subject: 'Mathematics',
      topicName: 'Place Value',
      questionText: 'Expand 45,678 using place values.',
      questionType: 'ShortAnswer',
      correctAnswer: '40000 + 5000 + 600 + 70 + 8',
      syllabusReference: 'Chapter 1.1: Expanded Form'
    },

    // Fractions
    {
      curriculum: 'CBSE', grade: 5, subject: 'Mathematics',
      topicName: 'Fractions',
      questionText: 'Which fraction is equivalent to 1/2?',
      questionType: 'MultipleChoice',
      options: ['2/3', '3/6', '1/4', '2/5'],
      correctAnswer: '3/6',
      syllabusReference: 'Chapter 2: Equivalent Fractions'
    },
    {
      curriculum: 'CBSE', grade: 5, subject: 'Mathematics',
      topicName: 'Fractions',
      questionText: 'Add: 1/4 + 1/4',
      questionType: 'ShortAnswer',
      correctAnswer: '1/2',
      syllabusReference: 'Chapter 2: Addition of Fractions'
    },
    {
      curriculum: 'CBSE', grade: 5, subject: 'Mathematics',
      topicName: 'Fractions',
      questionText: 'Convert 3/4 to decimal.',
      questionType: 'Numerical',
      correctAnswer: '0.75',
      syllabusReference: 'Chapter 2: Fractions to Decimals'
    },
    {
      curriculum: 'CBSE', grade: 5, subject: 'Mathematics',
      topicName: 'Fractions',
      questionText: 'What is 2/5 of 20?',
      questionType: 'Numerical',
      correctAnswer: '8',
      syllabusReference: 'Chapter 2: Fraction of a Number'
    },

    // Geometry
    {
      curriculum: 'CBSE', grade: 5, subject: 'Mathematics',
      topicName: 'Geometry',
      questionText: 'What is the perimeter of a rectangle with length 8 cm and width 5 cm?',
      questionType: 'Numerical',
      correctAnswer: '26',
      syllabusReference: 'Chapter 3: Perimeter'
    },
    {
      curriculum: 'CBSE', grade: 5, subject: 'Mathematics',
      topicName: 'Geometry',
      questionText: 'Calculate the area of a square with side 6 cm.',
      questionType: 'Numerical',
      correctAnswer: '36',
      syllabusReference: 'Chapter 3: Area of Square'
    },
    {
      curriculum: 'CBSE', grade: 5, subject: 'Mathematics',
      topicName: 'Geometry',
      questionText: 'How many degrees are in a right angle?',
      questionType: 'MultipleChoice',
      options: ['45', '60', '90', '180'],
      correctAnswer: '90',
      syllabusReference: 'Chapter 3: Angles'
    },

    // Decimals
    {
      curriculum: 'CBSE', grade: 5, subject: 'Mathematics',
      topicName: 'Decimals',
      questionText: 'Add: 3.5 + 2.7',
      questionType: 'Numerical',
      correctAnswer: '6.2',
      syllabusReference: 'Chapter 4: Addition of Decimals'
    },
    {
      curriculum: 'CBSE', grade: 5, subject: 'Mathematics',
      topicName: 'Decimals',
      questionText: 'Which is greater: 0.8 or 0.75?',
      questionType: 'Numerical',
      correctAnswer: '0.8',
      syllabusReference: 'Chapter 4: Comparing Decimals'
    },
    {
      curriculum: 'CBSE', grade: 5, subject: 'Mathematics',
      topicName: 'Decimals',
      questionText: 'Convert 0.25 to a fraction.',
      questionType: 'ShortAnswer',
      correctAnswer: '1/4',
      syllabusReference: 'Chapter 4: Decimals to Fractions'
    },

    // ===== CBSE Grade 5 Science =====
    // Living and Non-living Things
    {
      curriculum: 'CBSE', grade: 5, subject: 'Science',
      topicName: 'Living and Non-living Things',
      questionText: 'Which of the following is a characteristic of living things?',
      questionType: 'MultipleChoice',
      options: ['Growth', 'Cannot move', 'No reproduction', 'No respiration'],
      correctAnswer: 'Growth',
      syllabusReference: 'Chapter 1: Characteristics of Life'
    },
    {
      curriculum: 'CBSE', grade: 5, subject: 'Science',
      topicName: 'Living and Non-living Things',
      questionText: 'Name one non-living thing found in nature.',
      questionType: 'ShortAnswer',
      correctAnswer: 'rock',
      syllabusReference: 'Chapter 1: Classification'
    },
    {
      curriculum: 'CBSE', grade: 5, subject: 'Science',
      topicName: 'Living and Non-living Things',
      questionText: 'Do all living things need food?',
      questionType: 'ShortAnswer',
      correctAnswer: 'yes',
      syllabusReference: 'Chapter 1: Nutrition in Living Things'
    },

    // Plants
    {
      curriculum: 'CBSE', grade: 5, subject: 'Science',
      topicName: 'Plants',
      questionText: 'What process do plants use to make their food?',
      questionType: 'ShortAnswer',
      correctAnswer: 'photosynthesis',
      syllabusReference: 'Chapter 2: Photosynthesis'
    },
    {
      curriculum: 'CBSE', grade: 5, subject: 'Science',
      topicName: 'Plants',
      questionText: 'Which part of the plant absorbs water from the soil?',
      questionType: 'MultipleChoice',
      options: ['Leaves', 'Stem', 'Roots', 'Flowers'],
      correctAnswer: 'Roots',
      syllabusReference: 'Chapter 2: Parts of Plants'
    },
    {
      curriculum: 'CBSE', grade: 5, subject: 'Science',
      topicName: 'Plants',
      questionText: 'What gas do plants release during photosynthesis?',
      questionType: 'ShortAnswer',
      correctAnswer: 'oxygen',
      syllabusReference: 'Chapter 2: Photosynthesis Process'
    },

    // Animals
    {
      curriculum: 'CBSE', grade: 5, subject: 'Science',
      topicName: 'Animals',
      questionText: 'Animals that eat only plants are called:',
      questionType: 'MultipleChoice',
      options: ['Carnivores', 'Herbivores', 'Omnivores', 'Decomposers'],
      correctAnswer: 'Herbivores',
      syllabusReference: 'Chapter 3: Animal Classification'
    },
    {
      curriculum: 'CBSE', grade: 5, subject: 'Science',
      topicName: 'Animals',
      questionText: 'Name one adaptation that helps a camel survive in the desert.',
      questionType: 'ShortAnswer',
      correctAnswer: 'hump',
      syllabusReference: 'Chapter 3: Animal Adaptations'
    },
    {
      curriculum: 'CBSE', grade: 5, subject: 'Science',
      topicName: 'Animals',
      questionText: 'Which animal lives in water?',
      questionType: 'ShortAnswer',
      correctAnswer: 'fish',
      syllabusReference: 'Chapter 3: Animal Habitats'
    },

    // ===== CBSE Grade 5 English =====
    // Reading Comprehension
    {
      curriculum: 'CBSE', grade: 5, subject: 'English',
      topicName: 'Reading Comprehension',
      questionText: 'What does the word "enormous" mean?',
      questionType: 'MultipleChoice',
      options: ['Very small', 'Very large', 'Very fast', 'Very slow'],
      correctAnswer: 'Very large',
      syllabusReference: 'Unit 1: Vocabulary'
    },
    {
      curriculum: 'CBSE', grade: 5, subject: 'English',
      topicName: 'Reading Comprehension',
      questionText: 'In the sentence "The cat sat on the mat," what is the subject?',
      questionType: 'ShortAnswer',
      correctAnswer: 'cat',
      syllabusReference: 'Unit 1: Sentence Structure'
    },

    // Grammar
    {
      curriculum: 'CBSE', grade: 5, subject: 'English',
      topicName: 'Grammar',
      questionText: 'Which word is a noun?',
      questionType: 'MultipleChoice',
      options: ['Run', 'Happy', 'Book', 'Quickly'],
      correctAnswer: 'Book',
      syllabusReference: 'Unit 2: Parts of Speech'
    },
    {
      curriculum: 'CBSE', grade: 5, subject: 'English',
      topicName: 'Grammar',
      questionText: 'What is the past tense of "go"?',
      questionType: 'ShortAnswer',
      correctAnswer: 'went',
      syllabusReference: 'Unit 2: Verb Tenses'
    },
    {
      curriculum: 'CBSE', grade: 5, subject: 'English',
      topicName: 'Grammar',
      questionText: 'Choose the correct sentence:',
      questionType: 'MultipleChoice',
      options: ['She go to school', 'She goes to school', 'She going to school', 'She gone to school'],
      correctAnswer: 'She goes to school',
      syllabusReference: 'Unit 2: Subject-Verb Agreement'
    },

    // ===== CBSE Grade 10 Mathematics =====
    // Real Numbers
    {
      curriculum: 'CBSE', grade: 10, subject: 'Mathematics',
      topicName: 'Real Numbers',
      questionText: 'What is the HCF of 12 and 18?',
      questionType: 'Numerical',
      correctAnswer: '6',
      syllabusReference: 'Chapter 1: HCF and LCM'
    },
    {
      curriculum: 'CBSE', grade: 10, subject: 'Mathematics',
      topicName: 'Real Numbers',
      questionText: 'Which of the following is an irrational number?',
      questionType: 'MultipleChoice',
      options: ['√4', '√9', '√2', '√16'],
      correctAnswer: '√2',
      syllabusReference: 'Chapter 1: Rational and Irrational Numbers'
    },
    {
      curriculum: 'CBSE', grade: 10, subject: 'Mathematics',
      topicName: 'Real Numbers',
      questionText: 'Express 0.333... as a fraction.',
      questionType: 'ShortAnswer',
      correctAnswer: '1/3',
      syllabusReference: 'Chapter 1: Decimal to Fraction Conversion'
    },
    {
      curriculum: 'CBSE', grade: 10, subject: 'Mathematics',
      topicName: 'Real Numbers',
      questionText: 'Find the LCM of 15 and 25.',
      questionType: 'Numerical',
      correctAnswer: '75',
      syllabusReference: 'Chapter 1: LCM Calculation'
    },

    // Polynomials
    {
      curriculum: 'CBSE', grade: 10, subject: 'Mathematics',
      topicName: 'Polynomials',
      questionText: 'What is the degree of the polynomial 3x² + 5x + 7?',
      questionType: 'Numerical',
      correctAnswer: '2',
      syllabusReference: 'Chapter 2: Degree of Polynomial'
    },
    {
      curriculum: 'CBSE', grade: 10, subject: 'Mathematics',
      topicName: 'Polynomials',
      questionText: 'Find the zeros of the polynomial x² - 5x + 6.',
      questionType: 'ShortAnswer',
      correctAnswer: '2, 3',
      syllabusReference: 'Chapter 2: Finding Zeros'
    },
    {
      curriculum: 'CBSE', grade: 10, subject: 'Mathematics',
      topicName: 'Polynomials',
      questionText: 'If α and β are zeros of x² - 7x + 12, what is α + β?',
      questionType: 'Numerical',
      correctAnswer: '7',
      syllabusReference: 'Chapter 2: Sum of Zeros'
    },

    // Quadratic Equations
    {
      curriculum: 'CBSE', grade: 10, subject: 'Mathematics',
      topicName: 'Quadratic Equations',
      questionText: 'Solve: x² - 4 = 0',
      questionType: 'ShortAnswer',
      correctAnswer: '2, -2',
      syllabusReference: 'Chapter 4: Solving by Factorization'
    },
    {
      curriculum: 'CBSE', grade: 10, subject: 'Mathematics',
      topicName: 'Quadratic Equations',
      questionText: 'What is the discriminant of x² + 5x + 6?',
      questionType: 'Numerical',
      correctAnswer: '1',
      syllabusReference: 'Chapter 4: Discriminant'
    },
    {
      curriculum: 'CBSE', grade: 10, subject: 'Mathematics',
      topicName: 'Quadratic Equations',
      questionText: 'The roots of a quadratic equation are real and distinct if the discriminant is:',
      questionType: 'MultipleChoice',
      options: ['< 0', '= 0', '> 0', 'undefined'],
      correctAnswer: '> 0',
      syllabusReference: 'Chapter 4: Nature of Roots'
    },

    // Trigonometry
    {
      curriculum: 'CBSE', grade: 10, subject: 'Mathematics',
      topicName: 'Trigonometry',
      questionText: 'What is the value of sin 90°?',
      questionType: 'Numerical',
      correctAnswer: '1',
      syllabusReference: 'Chapter 8: Trigonometric Ratios'
    },
    {
      curriculum: 'CBSE', grade: 10, subject: 'Mathematics',
      topicName: 'Trigonometry',
      questionText: 'If cos θ = 0.5, what is θ?',
      questionType: 'MultipleChoice',
      options: ['30°', '45°', '60°', '90°'],
      correctAnswer: '60°',
      syllabusReference: 'Chapter 8: Trigonometric Values'
    },
    {
      curriculum: 'CBSE', grade: 10, subject: 'Mathematics',
      topicName: 'Trigonometry',
      questionText: 'What is tan 45°?',
      questionType: 'Numerical',
      correctAnswer: '1',
      syllabusReference: 'Chapter 8: Standard Angles'
    },

    // ===== CBSE Grade 10 Science =====
    // Chemical Reactions
    {
      curriculum: 'CBSE', grade: 10, subject: 'Science',
      topicName: 'Chemical Reactions',
      questionText: 'What type of reaction is 2H₂ + O₂ → 2H₂O?',
      questionType: 'MultipleChoice',
      options: ['Decomposition', 'Combination', 'Displacement', 'Double displacement'],
      correctAnswer: 'Combination',
      syllabusReference: 'Chapter 1: Types of Reactions'
    },
    {
      curriculum: 'CBSE', grade: 10, subject: 'Science',
      topicName: 'Chemical Reactions',
      questionText: 'Balance the equation: Fe + O₂ → Fe₂O₃',
      questionType: 'ShortAnswer',
      correctAnswer: '4Fe + 3O₂ → 2Fe₂O₃',
      syllabusReference: 'Chapter 1: Balancing Equations'
    },
    {
      curriculum: 'CBSE', grade: 10, subject: 'Science',
      topicName: 'Chemical Reactions',
      questionText: 'In a redox reaction, oxidation involves:',
      questionType: 'MultipleChoice',
      options: ['Gain of electrons', 'Loss of electrons', 'Gain of protons', 'Loss of neutrons'],
      correctAnswer: 'Loss of electrons',
      syllabusReference: 'Chapter 1: Oxidation-Reduction'
    },

    // Life Processes
    {
      curriculum: 'CBSE', grade: 10, subject: 'Science',
      topicName: 'Life Processes',
      questionText: 'What is the primary function of the mitochondria?',
      questionType: 'MultipleChoice',
      options: ['Protein synthesis', 'Energy production', 'Photosynthesis', 'Cell division'],
      correctAnswer: 'Energy production',
      syllabusReference: 'Chapter 6: Cellular Respiration'
    },
    {
      curriculum: 'CBSE', grade: 10, subject: 'Science',
      topicName: 'Life Processes',
      questionText: 'Name the process by which plants lose water through stomata.',
      questionType: 'ShortAnswer',
      correctAnswer: 'transpiration',
      syllabusReference: 'Chapter 6: Transportation in Plants'
    },
    {
      curriculum: 'CBSE', grade: 10, subject: 'Science',
      topicName: 'Life Processes',
      questionText: 'Which organ filters blood in the human body?',
      questionType: 'ShortAnswer',
      correctAnswer: 'kidney',
      syllabusReference: 'Chapter 6: Excretion'
    },

    // Electricity
    {
      curriculum: 'CBSE', grade: 10, subject: 'Science',
      topicName: 'Electricity',
      questionText: 'According to Ohm\'s law, V = ?',
      questionType: 'MultipleChoice',
      options: ['I/R', 'IR', 'R/I', 'I + R'],
      correctAnswer: 'IR',
      syllabusReference: 'Chapter 12: Ohm\'s Law'
    },
    {
      curriculum: 'CBSE', grade: 10, subject: 'Science',
      topicName: 'Electricity',
      questionText: 'If a current of 2A flows through a resistance of 5Ω, what is the voltage?',
      questionType: 'Numerical',
      correctAnswer: '10',
      syllabusReference: 'Chapter 12: Calculating Voltage'
    },
    {
      curriculum: 'CBSE', grade: 10, subject: 'Science',
      topicName: 'Electricity',
      questionText: 'In a series circuit, the total resistance is:',
      questionType: 'MultipleChoice',
      options: ['Sum of all resistances', 'Product of all resistances', 'Average of resistances', 'Minimum resistance'],
      correctAnswer: 'Sum of all resistances',
      syllabusReference: 'Chapter 12: Series Circuits'
    },

    // ===== CBSE Grade 10 English =====
    // Literature
    {
      curriculum: 'CBSE', grade: 10, subject: 'English',
      topicName: 'Literature',
      questionText: 'What is a metaphor?',
      questionType: 'MultipleChoice',
      options: ['A direct comparison', 'An indirect comparison', 'A sound device', 'A rhyme scheme'],
      correctAnswer: 'An indirect comparison',
      syllabusReference: 'Unit 1: Literary Devices'
    },
    {
      curriculum: 'CBSE', grade: 10, subject: 'English',
      topicName: 'Literature',
      questionText: 'What is the main theme of a story?',
      questionType: 'ShortAnswer',
      correctAnswer: 'central idea',
      syllabusReference: 'Unit 1: Theme Analysis'
    },
    {
      curriculum: 'CBSE', grade: 10, subject: 'English',
      topicName: 'Literature',
      questionText: 'Identify the figure of speech: "The stars danced in the sky."',
      questionType: 'ShortAnswer',
      correctAnswer: 'personification',
      syllabusReference: 'Unit 1: Figurative Language'
    },

    // ===== Cambridge Grade 1 Mathematics =====
    // Number
    {
      curriculum: 'Cambridge', grade: 1, subject: 'Mathematics',
      topicName: 'Number',
      questionText: 'What number comes between 10 and 12?',
      questionType: 'Numerical',
      correctAnswer: '11',
      syllabusReference: 'Stage 1: Number Sequence'
    },
    {
      curriculum: 'Cambridge', grade: 1, subject: 'Mathematics',
      topicName: 'Number',
      questionText: 'Count: 5, 10, 15, 20, __',
      questionType: 'Numerical',
      correctAnswer: '25',
      syllabusReference: 'Stage 1: Skip Counting'
    },
    {
      curriculum: 'Cambridge', grade: 1, subject: 'Mathematics',
      topicName: 'Number',
      questionText: 'Which number is smaller: 8 or 12?',
      questionType: 'Numerical',
      correctAnswer: '8',
      syllabusReference: 'Stage 1: Comparing Numbers'
    },

    // Geometry
    {
      curriculum: 'Cambridge', grade: 1, subject: 'Mathematics',
      topicName: 'Geometry',
      questionText: 'Which shape is round?',
      questionType: 'MultipleChoice',
      options: ['Square', 'Triangle', 'Circle', 'Rectangle'],
      correctAnswer: 'Circle',
      syllabusReference: 'Stage 1: Shape Recognition'
    },
    {
      curriculum: 'Cambridge', grade: 1, subject: 'Mathematics',
      topicName: 'Geometry',
      questionText: 'How many corners does a square have?',
      questionType: 'Numerical',
      correctAnswer: '4',
      syllabusReference: 'Stage 1: Shape Properties'
    },

    // ===== Cambridge Grade 5 Mathematics =====
    // Number
    {
      curriculum: 'Cambridge', grade: 5, subject: 'Mathematics',
      topicName: 'Number',
      questionText: 'Round 4,567 to the nearest hundred.',
      questionType: 'Numerical',
      correctAnswer: '4600',
      syllabusReference: 'Stage 5: Rounding'
    },
    {
      curriculum: 'Cambridge', grade: 5, subject: 'Mathematics',
      topicName: 'Number',
      questionText: 'What is 3.5 × 10?',
      questionType: 'Numerical',
      correctAnswer: '35',
      syllabusReference: 'Stage 5: Decimal Operations'
    },
    {
      curriculum: 'Cambridge', grade: 5, subject: 'Mathematics',
      topicName: 'Number',
      questionText: 'Write 2,345,678 in expanded form.',
      questionType: 'ShortAnswer',
      correctAnswer: '2000000 + 300000 + 40000 + 5000 + 600 + 70 + 8',
      syllabusReference: 'Stage 5: Place Value'
    },

    // Fractions and Decimals
    {
      curriculum: 'Cambridge', grade: 5, subject: 'Mathematics',
      topicName: 'Fractions and Decimals',
      questionText: 'Convert 0.5 to a fraction.',
      questionType: 'ShortAnswer',
      correctAnswer: '1/2',
      syllabusReference: 'Stage 5: Decimal to Fraction'
    },
    {
      curriculum: 'Cambridge', grade: 5, subject: 'Mathematics',
      topicName: 'Fractions and Decimals',
      questionText: 'Which is larger: 3/4 or 2/3?',
      questionType: 'ShortAnswer',
      correctAnswer: '3/4',
      syllabusReference: 'Stage 5: Comparing Fractions'
    },
    {
      curriculum: 'Cambridge', grade: 5, subject: 'Mathematics',
      topicName: 'Fractions and Decimals',
      questionText: 'Calculate: 1/2 + 1/3',
      questionType: 'ShortAnswer',
      correctAnswer: '5/6',
      syllabusReference: 'Stage 5: Adding Fractions'
    },

    // Measurement
    {
      curriculum: 'Cambridge', grade: 5, subject: 'Mathematics',
      topicName: 'Measurement',
      questionText: 'How many centimeters are in 2 meters?',
      questionType: 'Numerical',
      correctAnswer: '200',
      syllabusReference: 'Stage 5: Unit Conversion'
    },
    {
      curriculum: 'Cambridge', grade: 5, subject: 'Mathematics',
      topicName: 'Measurement',
      questionText: 'What is the area of a rectangle with length 10 cm and width 4 cm?',
      questionType: 'Numerical',
      correctAnswer: '40',
      syllabusReference: 'Stage 5: Area Calculation'
    },
    {
      curriculum: 'Cambridge', grade: 5, subject: 'Mathematics',
      topicName: 'Measurement',
      questionText: 'Convert 3 kg to grams.',
      questionType: 'Numerical',
      correctAnswer: '3000',
      syllabusReference: 'Stage 5: Mass Conversion'
    },

    // Geometry
    {
      curriculum: 'Cambridge', grade: 5, subject: 'Mathematics',
      topicName: 'Geometry',
      questionText: 'How many lines of symmetry does a square have?',
      questionType: 'Numerical',
      correctAnswer: '4',
      syllabusReference: 'Stage 5: Symmetry'
    },
    {
      curriculum: 'Cambridge', grade: 5, subject: 'Mathematics',
      topicName: 'Geometry',
      questionText: 'What is the sum of angles in a triangle?',
      questionType: 'Numerical',
      correctAnswer: '180',
      syllabusReference: 'Stage 5: Angle Properties'
    },
    {
      curriculum: 'Cambridge', grade: 5, subject: 'Mathematics',
      topicName: 'Geometry',
      questionText: 'A shape with 5 sides is called a:',
      questionType: 'ShortAnswer',
      correctAnswer: 'pentagon',
      syllabusReference: 'Stage 5: Polygon Names'
    },

    // ===== Cambridge Grade 5 Science =====
    // Living Things
    {
      curriculum: 'Cambridge', grade: 5, subject: 'Science',
      topicName: 'Living Things',
      questionText: 'Which group do mammals belong to?',
      questionType: 'MultipleChoice',
      options: ['Invertebrates', 'Vertebrates', 'Plants', 'Fungi'],
      correctAnswer: 'Vertebrates',
      syllabusReference: 'Stage 5: Classification'
    },
    {
      curriculum: 'Cambridge', grade: 5, subject: 'Science',
      topicName: 'Living Things',
      questionText: 'Name one life process common to all living things.',
      questionType: 'ShortAnswer',
      correctAnswer: 'respiration',
      syllabusReference: 'Stage 5: Life Processes'
    },
    {
      curriculum: 'Cambridge', grade: 5, subject: 'Science',
      topicName: 'Living Things',
      questionText: 'What is the habitat of a polar bear?',
      questionType: 'ShortAnswer',
      correctAnswer: 'arctic',
      syllabusReference: 'Stage 5: Habitats and Adaptations'
    },

    // Forces and Motion
    {
      curriculum: 'Cambridge', grade: 5, subject: 'Science',
      topicName: 'Forces and Motion',
      questionText: 'What force opposes motion?',
      questionType: 'ShortAnswer',
      correctAnswer: 'friction',
      syllabusReference: 'Stage 5: Types of Forces'
    },
    {
      curriculum: 'Cambridge', grade: 5, subject: 'Science',
      topicName: 'Forces and Motion',
      questionText: 'If an object moves 100 meters in 10 seconds, what is its speed?',
      questionType: 'Numerical',
      correctAnswer: '10',
      syllabusReference: 'Stage 5: Speed Calculation'
    },
    {
      curriculum: 'Cambridge', grade: 5, subject: 'Science',
      topicName: 'Forces and Motion',
      questionText: 'Which force pulls objects toward Earth?',
      questionType: 'ShortAnswer',
      correctAnswer: 'gravity',
      syllabusReference: 'Stage 5: Gravity'
    },

    // Materials
    {
      curriculum: 'Cambridge', grade: 5, subject: 'Science',
      topicName: 'Materials',
      questionText: 'Which state of matter has a fixed shape?',
      questionType: 'MultipleChoice',
      options: ['Solid', 'Liquid', 'Gas', 'Plasma'],
      correctAnswer: 'Solid',
      syllabusReference: 'Stage 5: States of Matter'
    },
    {
      curriculum: 'Cambridge', grade: 5, subject: 'Science',
      topicName: 'Materials',
      questionText: 'What happens when water freezes?',
      questionType: 'ShortAnswer',
      correctAnswer: 'becomes ice',
      syllabusReference: 'Stage 5: Changes of State'
    },
    {
      curriculum: 'Cambridge', grade: 5, subject: 'Science',
      topicName: 'Materials',
      questionText: 'Is melting a reversible or irreversible change?',
      questionType: 'ShortAnswer',
      correctAnswer: 'reversible',
      syllabusReference: 'Stage 5: Reversible Changes'
    },

    // ===== Cambridge Grade 5 English =====
    // Reading
    {
      curriculum: 'Cambridge', grade: 5, subject: 'English',
      topicName: 'Reading',
      questionText: 'What does "inference" mean in reading?',
      questionType: 'MultipleChoice',
      options: ['Reading aloud', 'Making conclusions', 'Summarizing', 'Memorizing'],
      correctAnswer: 'Making conclusions',
      syllabusReference: 'Stage 5: Reading Skills'
    },
