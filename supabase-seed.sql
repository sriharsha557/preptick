-- PrepTick Seed Data for Supabase PostgreSQL
-- Run this script in Supabase SQL Editor after creating the schema

-- Clear existing data (optional - comment out if you want to keep existing data)
DELETE FROM "UserQuestion";
DELETE FROM "PerformanceReport";
DELETE FROM "Evaluation";
DELETE FROM "UserResponse";
DELETE FROM "TestSession";
DELETE FROM "TestQuestion";
DELETE FROM "Test";
DELETE FROM "Question";
DELETE FROM "SyllabusTopic";
DELETE FROM "User";

-- CBSE Mathematics Topics
-- Grade 1
INSERT INTO "SyllabusTopic" (id, curriculum, grade, subject, "topicName", "syllabusSection", "officialContent", "learningObjectives") VALUES
(uuid_generate_v4()::TEXT, 'CBSE', 1, 'Mathematics', 'Numbers up to 100', 'Chapter 1', 'Counting, reading, and writing numbers from 1 to 100', '["Count objects up to 100", "Read and write numbers", "Compare numbers"]'),
(uuid_generate_v4()::TEXT, 'CBSE', 1, 'Mathematics', 'Addition and Subtraction', 'Chapter 2', 'Basic addition and subtraction within 20', '["Add numbers within 20", "Subtract numbers within 20", "Solve word problems"]'),
(uuid_generate_v4()::TEXT, 'CBSE', 1, 'Mathematics', 'Shapes and Patterns', 'Chapter 3', 'Identifying basic 2D shapes and simple patterns', '["Identify circles, squares, triangles", "Recognize patterns", "Draw shapes"]');

-- Grade 5 Mathematics
INSERT INTO "SyllabusTopic" (id, curriculum, grade, subject, "topicName", "syllabusSection", "officialContent", "learningObjectives") VALUES
(uuid_generate_v4()::TEXT, 'CBSE', 5, 'Mathematics', 'Numbers', 'Chapter 1', 'Understanding place value, comparing numbers, and operations', '["Read and write numbers up to 8 digits", "Compare and order numbers", "Perform addition and subtraction"]'),
(uuid_generate_v4()::TEXT, 'CBSE', 5, 'Mathematics', 'Fractions', 'Chapter 2', 'Understanding fractions, equivalent fractions, and operations', '["Identify and represent fractions", "Find equivalent fractions", "Add and subtract fractions"]'),
(uuid_generate_v4()::TEXT, 'CBSE', 5, 'Mathematics', 'Geometry', 'Chapter 3', 'Understanding shapes, angles, and basic geometric concepts', '["Identify 2D and 3D shapes", "Measure angles", "Calculate perimeter and area"]'),
(uuid_generate_v4()::TEXT, 'CBSE', 5, 'Mathematics', 'Decimals', 'Chapter 4', 'Introduction to decimal numbers and operations', '["Understand decimal notation", "Compare decimals", "Add and subtract decimals"]');

-- Grade 10 Mathematics
INSERT INTO "SyllabusTopic" (id, curriculum, grade, subject, "topicName", "syllabusSection", "officialContent", "learningObjectives") VALUES
(uuid_generate_v4()::TEXT, 'CBSE', 10, 'Mathematics', 'Real Numbers', 'Chapter 1', 'Euclids division lemma, fundamental theorem of arithmetic, rational and irrational numbers', '["Apply Euclids division algorithm", "Find HCF and LCM", "Prove irrationality"]'),
(uuid_generate_v4()::TEXT, 'CBSE', 10, 'Mathematics', 'Polynomials', 'Chapter 2', 'Zeros of polynomial, relationship between zeros and coefficients', '["Find zeros of polynomials", "Verify relationships", "Divide polynomials"]'),
(uuid_generate_v4()::TEXT, 'CBSE', 10, 'Mathematics', 'Quadratic Equations', 'Chapter 4', 'Standard form, solution by factorization, completing the square, and quadratic formula', '["Solve by factorization", "Use quadratic formula", "Apply to word problems"]'),
(uuid_generate_v4()::TEXT, 'CBSE', 10, 'Mathematics', 'Trigonometry', 'Chapter 8', 'Trigonometric ratios, identities, and applications', '["Calculate trigonometric ratios", "Prove identities", "Solve height and distance problems"]');

-- CBSE Science Topics
-- Grade 5 Science
INSERT INTO "SyllabusTopic" (id, curriculum, grade, subject, "topicName", "syllabusSection", "officialContent", "learningObjectives") VALUES
(uuid_generate_v4()::TEXT, 'CBSE', 5, 'Science', 'Living and Non-living Things', 'Chapter 1', 'Characteristics of living things and classification', '["Distinguish living from non-living", "Identify characteristics of life", "Classify organisms"]'),
(uuid_generate_v4()::TEXT, 'CBSE', 5, 'Science', 'Plants', 'Chapter 2', 'Parts of plants, photosynthesis, and plant life cycle', '["Identify plant parts", "Understand photosynthesis", "Describe plant reproduction"]'),
(uuid_generate_v4()::TEXT, 'CBSE', 5, 'Science', 'Animals', 'Chapter 3', 'Animal classification, habitats, and adaptations', '["Classify animals", "Identify habitats", "Understand adaptations"]');

-- Grade 10 Science
INSERT INTO "SyllabusTopic" (id, curriculum, grade, subject, "topicName", "syllabusSection", "officialContent", "learningObjectives") VALUES
(uuid_generate_v4()::TEXT, 'CBSE', 10, 'Science', 'Chemical Reactions', 'Chapter 1', 'Types of chemical reactions, balancing equations, and oxidation-reduction', '["Balance chemical equations", "Identify reaction types", "Understand redox reactions"]'),
(uuid_generate_v4()::TEXT, 'CBSE', 10, 'Science', 'Life Processes', 'Chapter 6', 'Nutrition, respiration, transportation, and excretion in living organisms', '["Explain nutrition in plants and animals", "Describe respiration", "Understand circulatory system"]'),
(uuid_generate_v4()::TEXT, 'CBSE', 10, 'Science', 'Electricity', 'Chapter 12', 'Electric current, potential difference, Ohms law, and electric circuits', '["Apply Ohms law", "Calculate resistance", "Analyze series and parallel circuits"]');

-- CBSE English Topics
INSERT INTO "SyllabusTopic" (id, curriculum, grade, subject, "topicName", "syllabusSection", "officialContent", "learningObjectives") VALUES
(uuid_generate_v4()::TEXT, 'CBSE', 5, 'English', 'Reading Comprehension', 'Unit 1', 'Understanding passages, answering questions, and vocabulary', '["Read and understand passages", "Answer comprehension questions", "Learn new vocabulary"]'),
(uuid_generate_v4()::TEXT, 'CBSE', 5, 'English', 'Grammar', 'Unit 2', 'Parts of speech, tenses, and sentence structure', '["Identify parts of speech", "Use correct tenses", "Form proper sentences"]'),
(uuid_generate_v4()::TEXT, 'CBSE', 10, 'English', 'Literature', 'Unit 1', 'Analysis of prose, poetry, and drama', '["Analyze literary texts", "Identify themes and characters", "Interpret figurative language"]');

-- Cambridge Mathematics Topics
-- Grade 1
INSERT INTO "SyllabusTopic" (id, curriculum, grade, subject, "topicName", "syllabusSection", "officialContent", "learningObjectives") VALUES
(uuid_generate_v4()::TEXT, 'Cambridge', 1, 'Mathematics', 'Number', 'Stage 1', 'Counting, ordering, and understanding numbers to 20', '["Count reliably to 20", "Order numbers", "Recognize number patterns"]'),
(uuid_generate_v4()::TEXT, 'Cambridge', 1, 'Mathematics', 'Geometry', 'Stage 1', 'Recognizing and naming 2D and 3D shapes', '["Name common shapes", "Describe shape properties", "Sort shapes"]');

-- Grade 5 Mathematics
INSERT INTO "SyllabusTopic" (id, curriculum, grade, subject, "topicName", "syllabusSection", "officialContent", "learningObjectives") VALUES
(uuid_generate_v4()::TEXT, 'Cambridge', 5, 'Mathematics', 'Number', 'Stage 5', 'Place value, ordering, rounding, and operations with whole numbers and decimals', '["Understand place value to millions", "Round numbers", "Perform operations with decimals"]'),
(uuid_generate_v4()::TEXT, 'Cambridge', 5, 'Mathematics', 'Fractions and Decimals', 'Stage 5', 'Understanding fractions, decimals, and their relationships', '["Convert between fractions and decimals", "Compare fractions", "Perform operations"]'),
(uuid_generate_v4()::TEXT, 'Cambridge', 5, 'Mathematics', 'Measurement', 'Stage 5', 'Length, mass, capacity, time, and area', '["Measure accurately", "Convert units", "Calculate area and perimeter"]'),
(uuid_generate_v4()::TEXT, 'Cambridge', 5, 'Mathematics', 'Geometry', 'Stage 5', 'Properties of shapes, angles, and symmetry', '["Classify shapes", "Measure angles", "Identify lines of symmetry"]');

-- Grade 10 Mathematics
INSERT INTO "SyllabusTopic" (id, curriculum, grade, subject, "topicName", "syllabusSection", "officialContent", "learningObjectives") VALUES
(uuid_generate_v4()::TEXT, 'Cambridge', 10, 'Mathematics', 'Algebra', 'IGCSE Core', 'Algebraic expressions, equations, inequalities, and sequences', '["Simplify expressions", "Solve equations", "Work with sequences"]'),
(uuid_generate_v4()::TEXT, 'Cambridge', 10, 'Mathematics', 'Functions', 'IGCSE Core', 'Linear, quadratic, and other functions', '["Plot graphs", "Find gradients", "Solve simultaneous equations graphically"]'),
(uuid_generate_v4()::TEXT, 'Cambridge', 10, 'Mathematics', 'Geometry and Trigonometry', 'IGCSE Core', 'Angles, triangles, circles, and basic trigonometry', '["Apply angle properties", "Use Pythagoras theorem", "Calculate using trigonometric ratios"]');

-- Cambridge Science Topics
-- Grade 5 Science
INSERT INTO "SyllabusTopic" (id, curriculum, grade, subject, "topicName", "syllabusSection", "officialContent", "learningObjectives") VALUES
(uuid_generate_v4()::TEXT, 'Cambridge', 5, 'Science', 'Living Things', 'Stage 5', 'Classification of living organisms and their characteristics', '["Classify living things into groups", "Understand life processes", "Identify habitats and adaptations"]'),
(uuid_generate_v4()::TEXT, 'Cambridge', 5, 'Science', 'Forces and Motion', 'Stage 5', 'Understanding forces, friction, and motion', '["Identify different types of forces", "Understand friction and its effects", "Measure and compare speeds"]'),
(uuid_generate_v4()::TEXT, 'Cambridge', 5, 'Science', 'Materials', 'Stage 5', 'Properties of materials and changes of state', '["Classify materials", "Understand reversible and irreversible changes", "Investigate dissolving"]');

-- Grade 10 Science
INSERT INTO "SyllabusTopic" (id, curriculum, grade, subject, "topicName", "syllabusSection", "officialContent", "learningObjectives") VALUES
(uuid_generate_v4()::TEXT, 'Cambridge', 10, 'Science', 'Biology - Cells', 'IGCSE', 'Cell structure, organization, and specialized cells', '["Identify cell structures", "Understand cell functions", "Compare plant and animal cells"]'),
(uuid_generate_v4()::TEXT, 'Cambridge', 10, 'Science', 'Chemistry - Atoms and Elements', 'IGCSE', 'Atomic structure, periodic table, and chemical bonding', '["Describe atomic structure", "Use the periodic table", "Explain chemical bonding"]'),
(uuid_generate_v4()::TEXT, 'Cambridge', 10, 'Science', 'Physics - Forces and Motion', 'IGCSE', 'Speed, velocity, acceleration, and Newtons laws', '["Calculate speed and acceleration", "Apply Newtons laws", "Understand momentum"]');

-- Cambridge English Topics
INSERT INTO "SyllabusTopic" (id, curriculum, grade, subject, "topicName", "syllabusSection", "officialContent", "learningObjectives") VALUES
(uuid_generate_v4()::TEXT, 'Cambridge', 5, 'English', 'Reading', 'Stage 5', 'Reading comprehension, inference, and analysis', '["Read with understanding", "Make inferences", "Analyze text structure"]'),
(uuid_generate_v4()::TEXT, 'Cambridge', 5, 'English', 'Writing', 'Stage 5', 'Creative and informative writing', '["Write narratives", "Write reports", "Use descriptive language"]'),
(uuid_generate_v4()::TEXT, 'Cambridge', 10, 'English', 'Literature', 'IGCSE', 'Analysis of prose, poetry, and drama from different cultures', '["Analyze literary techniques", "Compare texts", "Write critical essays"]');

-- Success message
DO $$
DECLARE
    topic_count INTEGER;
    cbse_count INTEGER;
    cambridge_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO topic_count FROM "SyllabusTopic";
    SELECT COUNT(*) INTO cbse_count FROM "SyllabusTopic" WHERE curriculum = 'CBSE';
    SELECT COUNT(*) INTO cambridge_count FROM "SyllabusTopic" WHERE curriculum = 'Cambridge';
    
    RAISE NOTICE '=== Seed Data Summary ===';
    RAISE NOTICE 'Total topics created: %', topic_count;
    RAISE NOTICE 'CBSE topics: %', cbse_count;
    RAISE NOTICE 'Cambridge topics: %', cambridge_count;
    RAISE NOTICE 'Database seeded successfully!';
END $$;
